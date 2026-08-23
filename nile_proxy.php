<?php
/**
 * Nile API Proxy - Run this on your LOCAL MACHINE (where Postman works)
 * This forwards requests from the server (10.2.2.155) to the hospital API (10.2.2.41)
 *
 * HOW TO START:
 *   php nile_proxy.php
 *
 * This will listen on port 8765 on your local machine.
 * Then update NILE_API_BASE_URL in .env on the server to point to this machine.
 */

$host = '0.0.0.0';
$port = 8765;
$targetBase = 'http://10.2.2.41/KsiApi';

echo "=== Nile API Proxy ===\n";
echo "Listening on: http://$host:$port\n";
echo "Forwarding to: $targetBase\n";
echo "Press Ctrl+C to stop.\n\n";

$server = stream_socket_server("tcp://$host:$port", $errno, $errstr);
if (!$server) {
    echo "Error: $errstr ($errno)\n";
    exit(1);
}

while (true) {
    $conn = stream_socket_accept($server, 30);
    if (!$conn) continue;

    $raw = '';
    stream_set_blocking($conn, true);
    while ($chunk = fread($conn, 8192)) {
        $raw .= $chunk;
        if (strpos($raw, "\r\n\r\n") !== false) {
            $headerEnd = strpos($raw, "\r\n\r\n");
            $headers = substr($raw, 0, $headerEnd);
            $body = substr($raw, $headerEnd + 4);
            // Check Content-Length to know if body is complete
            preg_match('/Content-Length:\s*(\d+)/i', $headers, $m);
            $expectedLen = isset($m[1]) ? (int)$m[1] : 0;
            if (strlen($body) >= $expectedLen) break;
        }
    }

    if (empty($raw)) { fclose($conn); continue; }

    // Parse request line
    $lines = explode("\r\n", $raw);
    preg_match('/^(\w+)\s+(\S+)\s+HTTP\/[\d.]+/', $lines[0], $m);
    $method = $m[1] ?? 'GET';
    $path   = $m[2] ?? '/';

    $headerEnd = strpos($raw, "\r\n\r\n");
    $headerSection = substr($raw, 0, $headerEnd);
    $body = substr($raw, $headerEnd + 4);

    $targetUrl = $targetBase . $path;
    echo "[" . date('H:i:s') . "] $method $path → $targetUrl\n";
    if ($body) echo "  Body: " . substr($body, 0, 100) . "\n";

    // Forward using curl
    $ch = curl_init($targetUrl);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

    // Pass all headers except Host
    $fwdHeaders = [];
    foreach (explode("\r\n", $headerSection) as $i => $line) {
        if ($i === 0) continue;
        if (stripos($line, 'Host:') === 0) continue;
        if ($line) $fwdHeaders[] = $line;
    }
    $fwdHeaders[] = 'Host: 10.2.2.41';
    curl_setopt($ch, CURLOPT_HTTPHEADER, $fwdHeaders);

    if ($body) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }

    $resp = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "  ← Response: HTTP $httpCode | " . substr($resp, 0, 80) . "\n\n";

    $responseHeaders  = "HTTP/1.1 $httpCode OK\r\n";
    $responseHeaders .= "Content-Type: application/json\r\n";
    $responseHeaders .= "Content-Length: " . strlen($resp) . "\r\n";
    $responseHeaders .= "Access-Control-Allow-Origin: *\r\n";
    $responseHeaders .= "\r\n";

    fwrite($conn, $responseHeaders . $resp);
    fclose($conn);
}
