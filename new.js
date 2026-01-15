const express = require('express');

logEvent('Server initialization started');
const { spawn } = require('child_process'); // Using spawn for safer command execution

const app = express();

const port = 3000;

app.use(express.urlencoded({ extended: true })); // To parse URL-encoded data

// Endpoint remediated against command injection
app.get('/api/network-status', (req, res) => {

    // User-supplied input
    const { host } = req.query; // Example: /api/network-status?host=example.com

    if (!host) {
        return res.status(400).send('Error: "host" query parameter is required.');
    }

    // Use spawn to execute the command safely.
    // The 'host' input is passed as an argument and not interpreted by the shell.
    const ping = spawn('ping', ['-c', '3', host]);

    let stdoutData = '';
    let stderrData = '';

    ping.stdout.on('data', (data) => {
        stdoutData += data.toString();
    });

    ping.stderr.on('data', (data) => {
        stderrData += data.toString();
    });

    ping.on('close', (code) => {
        if (code !== 0) {
            logEvent(`Error: ping process for ${host} exited with code ${code}`);
            if (stderrData) {
                logEvent(`Error details: ${stderrData}`);
            }
            return res.status(500).send(`Error executing ping command.`);
        }
        logEvent(`Successfully completed ping for ${host}`);
        res.setHeader('Content-Type', 'text/plain');
        res.send(`Network status for ${host}:\n\n${stdoutData}`);
    });

    ping.on('error', (err) => {
        logEvent(`Error: Failed to start ping subprocess for ${host}: ${err.message}`);
        res.status(500).send(`Failed to start ping command.`);
    });
});

app.listen(port, () => {
    logEvent(`Server started and listening on port ${port}`);
    logEvent('Network status endpoint initialized with command injection protection');
    logEvent('Example endpoints available:');
    logEvent(' - Network status: http://localhost:3000/api/network-status?host=example.com');
    logEvent(' - Command injection test: http://localhost:3000/api/network-status?host=example.com;ls');
});