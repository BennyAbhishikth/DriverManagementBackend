import express from 'express';
import multer from 'multer';
import mysql from 'mysql2';
import xlsx from 'xlsx';
import fs from 'fs';
import cors from 'cors';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import mailer from 'nodemailer'
import dotenv from 'dotenv';

const app = express();
app.use(express.json());
app.use(bodyParser.json());
dotenv.config();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Reddy',
    database: 'DriverDB'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
});

const corsOptions = {
    origin: '*',
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.get('/test-cors', (req, res) => {
    res.json({ message: 'CORS is working!' });
});

// const upload = multer({ dest: 'uploads/' });
const transporter = mailer.createTransport({
    service: "gmail",
    port: 465,
    secure: true,
    auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.PASSWORD
    }
});

const htmlTemplate = (driverName,email, password,) => `
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #dddddd; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); overflow: hidden;">
       <div style="padding: 20px; background: linear-gradient(to right, #007bff, #00d4ff); text-align: center; border-radius: 15px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
            <!-- Logo Section -->
            <div style="display: inline-block; vertical-align: middle; margin-right: 15px;">
                <img src="https://res.cloudinary.com/dalzs7bc2/image/upload/v1725259921/logo_ksostb.png" alt="Company Logo" style="max-width: 80px; border-radius: 10px; background-color: #ffffff; padding: 5px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);">
            </div>
            <!-- Company Name and Tagline Section -->
            <div style="display: inline-block; vertical-align: middle; text-align: left;">
                <p style="font-size: 26px; color: #ffffff; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
                    VTS Transport
                </p>
                <p style="font-size: 14px; color: #f0f0f0; margin: 5px 0 0 0;">
                    Seamless & Secure Journey
                </p>
            </div>
        </div>
        <!-- Content Section -->
        <h2 style="text-align: center; padding: 20px 0; color: #333;">Driver User ID and Login Credentials</h2>
        <div style="margin: 20px 0; padding: 0 20px;">
            <p style="font-size: 16px; line-height: 1.8;">Dear ${driverName},</p>
            <p style="font-size: 16px; line-height: 1.8;">Your login credentials for accessing your driver dashboard are provided below:</p>
            <p style="font-size: 16px; line-height: 1.8;color:black;"><strong>Email:</strong> ${email}</p>
            <p style="font-size: 16px; line-height: 1.8;"><strong>Password:</strong><br> ${password}</p>
            <p style="font-size: 16px; line-height: 1.8;">Please click the button below to log in to your account:</p>
            <!-- Login Now Button -->
            <p style="text-align: center;">
                <a href="[Login Link]" target="_blank" style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); transition: background-color 0.3s ease;">
                    Login Now
                </a>
            </p>
            <p style="font-size: 16px; line-height: 1.8;">If you have any questions or issues, please feel free to contact the support team.</p>
        </div>
        <!-- Footer Section -->
        <div style="margin-top: 30px; padding: 20px; font-size: 14px; color: #777; text-align: center;">
            <p>Thank you,</p>
            <p>VTS Support Team</p>
            <p><a href="mailto:hr@vtshrteam.com" style="color: #007bff; text-decoration: none;">hr@vtshrteam.com</a> | +91 9141725777</p>
        </div>
    </div>
</body>`;

async function sendMail(mailId, driverName, userId, password) {
    const info = await transporter.sendMail({
        from: process.env.USER_EMAIL,
        to: [mailId],
        subject: "Your Email and Password For Driver",
        html: htmlTemplate(driverName, userId, password),
    });
    return info.messageId;
}




app.post("/addDriver", (req, res) => {
    console.log('Request body:', req.body);

    const { driverName, vendorName, contact, email, gender, dob, address, experience, aadhar, pan, licenceNumber, profilePic } = req.body;

    // Generate a random password
    const password = crypto.randomBytes(7).toString('hex');

    const query = `INSERT INTO Driver_Details1 
    (driverName, vendorName, contact, email, gender, dob, address, experience, aadhar, pan, licenceNumber, profilePic, password) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [
        driverName, vendorName, contact, email, gender, dob, address, experience, aadhar, pan, licenceNumber, profilePic, password
    ], async (err, result) => {
        if (err) {
            console.error('Error inserting driver:', err);
            return res.status(500).send({ message: "Error in adding driver" });
        }

        // Send email with login credentials
        try {
            const messageId = await sendMail(email, driverName, email, password);
            res.status(201).json({ message: 'Driver added successfully', driverId: result.insertId, password: password, emailMessageId: messageId });
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            res.status(500).json({ message: "Driver added but failed to send email" });
        }
    });
});



// POST API to add driver details from excel
// app.post('/import-drivers', upload.single('file'), (req, res) => {
//     const filePath = req.file.path;
//     const workbook = xlsx.readFile(filePath);
//     const sheetName = workbook.SheetNames[0];
//     const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

//     const query = `INSERT INTO Driver_Details1 (driverName,vendorName, contact, email, gender, dob, address, experience, aadhar, pan, licenceNumber, profilePic) 
//                     VALUES ?`;

//     const values = sheetData.map(row => [
//         row.driverName, 
//         row.vendorName,
//         row.contact,
//         row.email, 
//         row.gender,
//         row.dob, 
//         row.address, 
//         row.experience,
//         row.aadhar, 
//         row.pan, 
//         row.licenceNumber,
//         row.profilePic
//     ]);

//     db.query(query, [values], (err, result) => {
       
//         fs.unlink(filePath, (unlinkErr) => {
//             if (unlinkErr) {
//                 console.error('Error deleting file:', unlinkErr);
//             }
//         });

//         if (err) {
//             console.error('Error importing Driver data:', err);
//             return res.status(500).json({ error: 'Database error' });
//         }
//         res.status(201).json({ message: 'Drivers Data imported successfully', insertedRows: result.affectedRows });
//     });
// });


// GET API to retrieve a list of drivers
app.get('/drivers', (req, res) => {
    const query = `SELECT * FROM Driver_Details1`;
   
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error retrieving driverss:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(200).json(results);
    });
});


// Get vehicle details by driverId
app.get('/drivers:driverId', (req, res) => {
    const driverId = req.params.driverId;

    const query = `SELECT 
            d.*,  
            v.* 
        FROM 
            Driver_Details1 d
        LEFT JOIN 
            Vehicle_Details v ON d.vehicleId = v.vehicleId 
        WHERE 
            d.driverId = ?`;
    
    db.query(query, [driverId], (err, result) => {
        if (err) {
            console.error('Error fetching driver details:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Driver not found' });
        }
        res.status(200).json(result[0]); // Returning the first (and only) object
    });
});




app.listen(8081, () => {
    console.log('Server is running on port 8081');
});