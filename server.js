
import express from 'express';
import multer from 'multer';
import mysql from 'mysql2';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';

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

app.post("/addDriver",(req,res) => {

    const {driverId,name,mobile,email,gender,age,dob,address,aadhar,pan,lic,exp,imageUrl,vehicleId} = req.body

    const query = `INSERT INTO driver_details (driverId,name,mobile,email,gender,age,dob,address,aadhar,pan,lic,exp,imageUrl,vehicleId) 
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    db.query(query ,  [driverId,name,mobile,email,gender,age,dob,address,aadhar,pan,lic,exp,imageUrl,vehicleId],(err , result) => {
        if(err) {
            console.log(err);
            res.status(500).send({message : "Error in adding driver" })
        }
        res.status(201).json({ message: 'Driver added successfully', driverId: result.insertId });
        
    })

})

// app.get("/getDrivers",(req,res) => {
//     const query = `SELECT * FROM driver_details`;

//     db.query(query,(err , results) => {
//         if(err) {
//             console.log(err);
//             res.status(500).send({message : "Error in getting drivers" })
//         }
//         res.status(200).json(results)
//     })
// })

app.get("/getDrivers", (req, res) => {
    // Modify the SQL query to join driver_details with Vehicle_Details
    const query = `
        SELECT 
            d.driverId, 
            d.name, 
            d.mobile, 
            d.email, 
            d.gender, 
            d.age, 
            d.dob, 
            d.address, 
            d.aadhar, 
            d.pan, 
            d.lic, 
            d.exp, 
            d.imageUrl, 
            d.joining_date, 
            d.total_distance, 
            d.succesful_trips, 
            d.status, 
            d.vehicleId,  
            v.vehicleName,
            v.vendorName,
            v.vendorId,
            v.registrationNumber,
            v.engineNumber,
            v.chassisNumber,
            v.fuelType,
            v.seatCapacity,
            v.mileage,
            v.yearOfManufacturing,
            v.vehicleImage
        FROM 
            driver_details d
        LEFT JOIN 
            Vehicle_Details v ON d.vehicleId = v.vehicleId
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send({ message: "Error in getting drivers" });
            return;
        }
        res.status(200).json(results);
    });
});

app.get('/drivers:driverId', (req, res) => {
    const driverId = req.params.driverId;

    const query = `SELECT 
            d.driverId, 
            d.name, 
            d.mobile, 
            d.email, 
            d.gender, 
            d.age, 
            d.dob, 
            d.address, 
            d.aadhar, 
            d.pan, 
            d.lic, 
            d.exp, 
            d.imageUrl, 
            d.joining_date, 
            d.total_distance, 
            d.succesful_trips, 
            d.status, 
            d.vehicleId,  
            v.* 
        FROM 
            driver_details d
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

app.put("/updateDriver",(req,res) => {

    const {driverId,name,mobile,email,gender,age,dob,address,aadhar,pan,lic,exp,imageUrl} = req.body

    const query = `UPDATE driver_details SET name = ? , mobile = ? , email = ? , gender = ? , age = ? , dob = ? , address = ?  , aadhar = ? , pan = ? , lic = ? , exp = ? , imageUrl = ?
                    WHERE driverId = ?`;

    db.query(query ,  [name,mobile,email,gender,age,dob,address,aadhar,pan,lic,exp,imageUrl , driverId],(err , result) => {
        if(err) {
            console.log(err);
            res.status(500).send({message : "Error in updating driver" })
        }
        res.status(201).json({ message: 'Driver details updated successfully'});
        
    })

})



app.listen(8081, () => {
    console.log('Server is running on port 8081');
});