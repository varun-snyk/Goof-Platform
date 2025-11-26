const express = require('express');
const { exec } = require('child_process'); // Module to execute shell commands

const app = express();

const port = 3000;

app.use(express.urlencoded({ extended: true })); // To parse URL-encoded data

// Endpoint that is vulnerable to command injection
app.get('/api/network-status', (req, res) => {

    // User-supplied input is directly used in a shell command
    const { host } = req.query; // Example: /api/network-status?host=example.com

    if (!host) {
        return res.status(400).send('Error: "host" query parameter is required.');
    }

    // Constructing the command string by concatenating user input
    // THIS IS THE VULNERABLE PART
    const command = `ping -c 3 ${host}`; // On Linux/macOS. For Windows, it might be 'ping -n 3 ${host}'

    console.log(`Executing command: ${command}`);

    // Executing the command
    exec(command, (error, stdout, stderr) => {

        if (error) {
            console.error(`Execution error: ${error.message}`);
            // It's generally not a good idea to send raw error messages to the client
            // but for this example, we'll keep it simple.
            return res.status(500).send(`Error executing command: ${error.message}`);
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            // Also not ideal to send raw stderr to client
            return res.status(500).send(`Command execution resulted in an error: ${stderr}`);
        }
        console.log(`Stdout: ${stdout}`);
        res.setHeader('Content-Type', 'text/plain');
        res.send(`Network status for ${host}:\n\n${stdout}`);
    });
});

app.listen(port, () => {
    console.log(`Vulnerable app listening at http://localhost:${port}`);
    console.log('WARNING: This application contains a command injection vulnerability.');
    console.log('DO NOT use this code in a production environment.');
    console.log('Try accessing: http://localhost:3000/api/network-status?host=example.com');
    console.log('Or try to inject a command: http://localhost:3000/api/network-status?host=example.com;ls');
});
