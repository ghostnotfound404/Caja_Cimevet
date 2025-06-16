<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type");

$response = ['success' => false, 'message' => 'Acción no válida'];
$data = json_decode(file_get_contents("php://input"), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $action = $data['action'] ?? '';
        $payload = $data['data'] ?? [];
        
        switch ($action) {
            case 'guardarItem':
                $response = guardarRegistro($payload, 'registros.csv');
                break;
                
            case 'guardarEgreso':
                $response = guardarRegistro($payload, 'egresos.csv');
                break;
                
            case 'cerrarCaja':
                $response = guardarRegistro($payload, 'cierres.csv');
                break;
                
            default:
                throw new Exception('Acción no reconocida');
        }
    } catch (Exception $e) {
        $response = ['success' => false, 'message' => $e->getMessage()];
    }
}

echo json_encode($response);

function guardarRegistro($data, $filename) {
    $filePath = __DIR__ . '/data/' . $filename;
    
    // Crear directorio si no existe
    if (!file_exists(dirname($filePath))) {
        mkdir(dirname($filePath), 0777, true);
    }
    
    // Si el archivo no existe, agregar encabezados
    if (!file_exists($filePath)) {
        $headers = array_keys($data);
        file_put_contents($filePath, implode(',', $headers) . PHP_EOL, FILE_APPEND);
    }
    
    // Agregar nueva fila
    file_put_contents($filePath, implode(',', $data) . PHP_EOL, FILE_APPEND);
    
    return [
        'success' => true,
        'message' => 'Registro guardado en ' . $filename
    ];
}