import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const sendReportEmail = async (email,report) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_CODE
        }
    });
 
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Auction Completed ... Check Status",
        text:report
    };
    return transporter.sendMail(mailOptions);
};