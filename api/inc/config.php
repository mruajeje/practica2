<?php
// ============================================================
// PARAMETROS GENERALES DE CONFIGURACION PARA EL SERVIDOR
// ============================================================
// CONSTANTES DE TEXTO. SE PUEDEN DECLARAR CON define().
define("PATH_FOTOS", "../fotos/");   // Path relativo hasta la carpeta de fotos, desde la raíz de la web (en este caso, htdocs/pcw/)
define("_REC_", "_rec_"); // nombre del parámetro en la petición que trae la parte de recurso de la URL
// LAS CONSTANTES NUMÉRICAS NO SE PUEDEN DECLARAR CON define().
$TAM_MAX_ARCHIVO = 200 * 1024; // Máximo peso permitido para las fotos en Bytes (300KB).
$TIEMPO_SESION = 7200; // Tiempo de sesión (en segundos) para una sesión por defecto.
/**
 * ============================================================
 * FUNCIONES AUXILIARES
 * ============================================================
 */
// =================================================================================
// Analiza la petición y devuelve la parte de recurso y la de
// los parámetros de la petición ($_GET o $_POST) según el valor de $metodo ('get', 'post')
// =================================================================================
function analizarPeticion(&$recurso, &$params, $metodo = 'get'){
    $rawPath = $_GET[_REC_] ?? '';
    // Quitamos barras al inicio y final, y dividimos
    // array_filter elimina entradas vacías (ej: usuario//editar -> usuario/editar)
    // array_values reordena los índices del array y los vuelve a renumerar 0, 1, 2, ...
    // por si array_filter ha eliminado algún elemento intermedio del array por estar vacío
    $pathTrimmed = trim($rawPath, '/');
    $recurso = $pathTrimmed !== '' ? array_values( array_filter( explode('/', $pathTrimmed), 'strlen' ) ) : [];
    // --------------------------------------------------------------------------------
    if( $metodo == 'get') {
        // Copiamos $_GET y quitamos la clave interna para dejar solo los parámetros
        $params = $_GET;
        unset($params[_REC_]);
    }
    else {
        $params = $_POST;
    }
}
// =================================================================================
// Sanatiza lo textos
// =================================================================================
function sanatize($valor) {
    return urldecode('' . $valor);
}

// =================================================================================
// JWT
// =================================================================================
define( "JWT_SECRET", "clave_secreta_PCW_2026" );

// Función auxiliar para Base64URL (el estándar JWT elimina +, / y =)
function base64url_encode( $data ) {
    return rtrim( strtr( base64_encode( $data ), '+/', '-_' ), '=' );
}

function base64url_decode( $data ) {
    return base64_decode( strtr( $data, '-_', '+/' ) );
}

/**
 * Genera un JWT recibiendo únicamente el array del payload
 */
function generar_jwt_nativo($payload) {
    // 1. Header fijo (estándar para JWT con firma HMAC SHA256)
    $header = json_encode([
        'typ' => 'JWT',
        'alg' => 'HS256'
    ]);

    // 2. Convertimos el payload recibido a JSON
    $payload_json = json_encode($payload);

    // Codificamos las dos primeras partes
    $base64UrlHeader = base64url_encode($header);
    $base64UrlPayload = base64url_encode($payload_json);

    // 3. Firma (Signature) usando la constante JWT_SECRET
    // Concatenamos header y payload separados por un punto
    $data_to_sign = $base64UrlHeader . "." . $base64UrlPayload;

    // Creamos la firma digital
    $signature = hash_hmac('sha256', $data_to_sign, JWT_SECRET, true);
    $base64UrlSignature = base64url_encode($signature);

    // Retornamos el token completo: HEADER.PAYLOAD.SIGNATURE
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

/**
 * Verifica y decodifica un JWT nativo
 * Retorna el payload (objeto) si es válido, o FALSE si no lo es
 */
function verificar_jwt_nativo( $jwt ) {
    // 1. Dividir el token en sus 3 partes
    $partes = explode('.', $jwt);
    if (count($partes) !== 3) {
        return false; // Estructura de token inválida
    }

    list($header64, $payload64, $signature64) = $partes;

    // 2. Recalcular la firma con la clave secreta del servidor
    // Importante: Usamos la misma constante JWT_SECRET
    $data_to_verify = $header64 . "." . $payload64;
    $signature_check = hash_hmac('sha256', $data_to_verify, JWT_SECRET, true);
    $signature_check64 = base64url_encode($signature_check);

    // 3. Comparación de firmas
    // Usamos hash_equals para evitar ataques de tiempo (seguridad extra)
    if (!hash_equals($signature_check64, $signature64)) {
        return false; // La firma no coincide: el token ha sido manipulado
    }

    // 4. Decodificar el Payload
    $payload = json_decode(base64url_decode($payload64), true); // El "true" lo convierte en array asociativo. Si no lo pones, crea un objeto.

    // 5. Comprobar si el token ha caducado
    if (isset($payload['exp']) && $payload['exp'] < time()) {
        return false; // Token expirado
    }

    return $payload; // El token es auténtico y válido
}

?>
