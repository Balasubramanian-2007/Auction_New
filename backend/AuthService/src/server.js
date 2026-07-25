import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';


const server=app;
const PORT=process.env.PORT||3000;
server.listen(PORT,()=>{
    console.log(`Auth Server running in PORT : ${PORT}`);
})