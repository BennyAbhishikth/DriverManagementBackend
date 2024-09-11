import express from 'express';
import multer from 'multer';
import mysql from 'mysql2';
import xlsx from 'xlsx';
import fs from 'fs';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
app.use(express.json());
app.use(bodyParser.json());


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Benny@7173',
    database: 'vems'
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

const upload = multer({ dest: 'uploads/' });


// POST API to add driver details
app.post("/addDriver",(req,res) => {
    console.log('Request body:', req.body);

    const { driverName, vendorName, contact, email, gender, dob, address, experience, aadhar, pan, licenceNumber, profilePic} = req.body;

  
    const query = `INSERT INTO Driver_Details1 (driverName, vendorName, contact, email, gender, dob, address, experience, aadhar, pan, licenceNumber, profilePic) 
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`;

    db.query(query ,  [
        driverName, vendorName, contact, email, gender, dob, address, experience, aadhar, pan, licenceNumber, profilePic
    ],(err , result) => {
        if(err) {
            console.log(err);
            console.error('Error inserting driver:', err);
            res.status(500).send({message : "Error in adding driver" })
        }
        res.status(201).json({ message: 'Driver added successfully', driverId: result.insertId });
        
    })

})

// POST API to add driver details from excel
app.post('/import-drivers', upload.single('file'), (req, res) => {
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const query = `INSERT INTO Driver_Details1 (driverName,vendorName, contact, email, gender, dob, address, experience, aadhar, pan, licenceNumber, profilePic) 
                    VALUES ?`;

    const values = sheetData.map(row => [
        row.driverName, 
        row.vendorName,
        row.contact,
        row.email, 
        row.gender,
        row.dob, 
        row.address, 
        row.experience,
        row.aadhar, 
        row.pan, 
        row.licenceNumber,
        row.profilePic
    ]);

    db.query(query, [values], (err, result) => {
       
        fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
                console.error('Error deleting file:', unlinkErr);
            }
        });

        if (err) {
            console.error('Error importing Driver data:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'Drivers Data imported successfully', insertedRows: result.affectedRows });
    });
});


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