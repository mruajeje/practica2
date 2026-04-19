 <?php
// FICHERO: api/get/actividades.php
// =================================================================================
// PETICIONES GET ADMITIDAS:
// =================================================================================
//   api/actividades  --------------------> devuelve todos los registros
//   api/actividades/{ID} ----------------> devuelve toda la información del registros con el ID que se le pasa
//   api/actividades/{ID}/fotos ----------> devuelve todas las fotos del registro con el ID que se le pasa
//   api/actividades/{ID}/categorias -----> devuelve todas las categorias del registro con el ID que se le pasa
//   api/actividades/{ID}/comentarios ----> devuelve todos los comentarios del registro con el ID que se le pasa
// ---------------------------------------------------------------------------------
// PARÁMETROS PARA LA BÚSQUEDA. DEVUELVE LOS REGISTROS QUE CUMPLAN TODOS LOS CRITERIOS DE BÚSQUEDA.
// SE PUEDEN COMBINAR TODOS LOS PARÁMETROS QUE SE QUIERA EN LA MISMA URL MEDIANTE EL OPERADOR &.
// EN LA CONSULTA EN LA BD SE UTILIZARÁ EL OPERADOR AND PARA COMBINAR TODOS LOS CRITERIOS ESPECIFICADOS.
//   api/actividades?t={texto} -> busca el texto indicado en el campo nombre o en el campo descripcion de la actividad. Devuelve la lista de registros que contengan al menos una de las palabras separadas por comas "," indicadas en {texto}. Por ejemplo: api/actividades?t=caminar,paseo
//   api/actividades?l={texto} -> busca el texto indicado en el campo lugar de la actividad. Devuelve la lista de registros que contengan al menos una de las palabras separadas por comas "," indicadas en {texto}. Por ejemplo: api/actividades?l=Alicante,Granada
//   api/actividades?a={autor} -> Devuelve la lista de registros que creados por el autor indicado en {autor}. Por ejemplo: api/actividades?a=usuario3
//   api/actividades?c={texto} -> busca el texto indicado en las categorías asignadas a la actividad. Devuelve la lista de actividades que tengan en sus etiquetas, al menos, una de las palabras separadas por comas "," indicadas en {texto}. Por ejemplo: api/actividades?c=Familiar,cultural
//   api/actividades?vd={valor}&vh={valor} -> busca actividades cuya valoración esté entre los valores indicados de valoración desde (vd) y valoración hasta (vh). Nota: La valoración es un valor entre 1 y 5

// ---------------------------------------------------------------------------------
// PAGINACIÓN POR RESULTADOS
//	 api/actividades?reg={número del primer registro a devolver (empieza en 0)}&cant={cantidad de registros a devolver} -> devuelve los registros que están entre las posiciones reg y reg + cant - 1. Por ejemplo: api/actividades?t=Familiar,Cultural&l=Alicante&reg=24&cant=6
// =================================================================================
// INCLUSIÓN DEL FICHERO DE CONFIGURACIÓN Y DE LA CONEXIÓN A LA BD
// =================================================================================
require_once('../inc/config.php'); // Constantes, etc ...
require_once('../inc/database.php');
// =================================================================================
// SE OBTIENE LA CONEXIÓN A AL BD
// =================================================================================
$db    = new Database();
$dbCon = $db->getConnection();
// =================================================================================
// RECURSO QUE VIENE EN LA PETICIÓN HTTP
// =================================================================================
analizarPeticion($RECURSO, $PARAMS);
// =================================================================================
// =================================================================================
// FUNCIONES AUXILIARES
// =================================================================================
// =================================================================================

// =================================================================================
// Añade las condiciones de filtro (búsqueda)
// =================================================================================
// $valores -> Guardará los valores de los parámetros, ya que la consulta es preparada
// $params  -> Trae los parámetros de la petición
function aplicarFiltro(&$valores, $params)
{
    $filtroSQL = '';

    // FILTRO POR TEXTO
    if( isset($params['t']) ) {
        if($filtroSQL != '') $filtroSQL .= ' and';
        $filtroSQL .= ' (false';

        $texto = explode(',', $params['t']);
        $paraTexto = '';
        foreach ($texto as $idx=>$valor) {
            $paraTexto .= ' or a.nombre like :NOMBRE' . $idx . ' or a.descripcion like :DESCRIPCION' . $idx;
            $valores[':NOMBRE' . $idx] = '%' . trim($valor) . '%';
            $valores[':DESCRIPCION' . $idx] = '%' . trim($valor) . '%';
        }
        $filtroSQL .= $paraTexto . ')';
    }
    // FILTRO POR LUGAR
    if( isset($params['l']) ) {
        if($filtroSQL != '') $filtroSQL .= ' and';
        $filtroSQL .= ' (false';

        $texto = explode(',', $params['l']);
        $paraLugar = '';
        foreach ($texto as $idx=>$valor) {
            $paraLugar .= ' or a.lugar like :LUGAR' . $idx;
            $valores[':LUGAR' . $idx] = '%' . trim($valor) . '%';
        }
        $filtroSQL .= $paraLugar . ')';
    }
    // FILTRO POR AUTOR
    if( isset($params['a']) ) {
        if($filtroSQL != '') $filtroSQL .= ' and';
        $filtroSQL .= ' (false';

        $texto = explode(',', $params['a']);
        $paraAutor = '';
        foreach ($texto as $idx=>$valor) {
            $paraAutor .= ' or a.login like :AUTOR' . $idx;
            $valores[':AUTOR' . $idx] = '%' . trim($valor) . '%';
        }
        $filtroSQL .= $paraAutor . ')';
    }
    // FILTRO POR CATEGORÍA
    if( isset($params['c']) ) {
        if($filtroSQL != '') $filtroSQL .= ' and';
        $filtroSQL .= ' a.id in (';
        $filtroSQL .= 'select distinct a.id from actividad_categoria ac, actividad a, categoria c ';
        $filtroSQL .= 'where ac.id_actividad=a.id and ac.id_categoria=c.id ';
        $filtroSQL .= 'and (false';

        $texto = explode(',', $params['c']);
        $paraCategoria = '';
        foreach ($texto as $idx=>$valor) {
            $paraCategoria .= ' or c.nombre like :CAT' . $idx;
            $valores[':CAT' . $idx] = '%' . trim($valor) . '%';
        }
        $filtroSQL .= $paraCategoria . '))';
    }
    // FILTRO POR VALORACIÓN
    // ... desde
    if( isset($params['vd']) && is_numeric($params['vd']) ) {
        if($filtroSQL != '') $filtroSQL .= ' and';
        $filtroSQL .= ' a.valoracion>=' . $params['vd'];
    }
    // ... hasta
    if( isset($params['vh']) && is_numeric($params['vh']) ) {
        if($filtroSQL != '') $filtroSQL .= ' and';
        $filtroSQL .= ' a.valoracion<=' . $params['vh'];
    }

    return $filtroSQL;
}
// =================================================================================
// =================================================================================
// FIN DE FUNCIONES AUXILIARES
// =================================================================================
// =================================================================================

// =================================================================================
// CONFIGURACIÓN DE SALIDA JSON Y CORS PARA PETICIONES AJAX
// =================================================================================
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE");
header("Content-Type: application/json; charset=UTF-8");
// =================================================================================
// SE PREPARA LA RESPUESTA
// =================================================================================
$R                   = [];  // Almacenará el resultado.
$RESPONSE_CODE       = 200; // código de respuesta por defecto: 200 - OK
$mysql               = '';  // para el SQL
$VALORES             = [];  // Son los valores para hacer la consulta
$TOTAL_COINCIDENCIAS = -1;  // Total de coincidencias en la BD
// =================================================================================
// SE COGE EL ID DEL REGISTRO, SI EXISTE
// =================================================================================
$ID = array_shift($RECURSO); // Se comprueba si se proporciona el id del registro
// =================================================================================
// SQL POR DEFECTO PARA SELECCIONAR TODOS LOS REGISTROS
// =================================================================================
$mysql  = 'select a.id, a.nombre, a.valoracion, a.lugar, a.login as autor';
$mysql .= ', (select foto from usuario u where u.login=a.login) as foto_autor';
$mysql .= ', (select fichero from foto f where f.id_actividad=a.id order by id limit 1) as foto';
$mysql .= ', DATE_FORMAT(a.fecha_alta,"%Y-%m-%d") as fecha_alta';

if(is_numeric($ID)) {
    // INFORMACIÓN RELACIONADA CON UN REGISTRO CONCRETO
    switch (array_shift($RECURSO)) {
        case 'comentarios': // SE PIDEN LOS COMENTARIOS
                $mysql   = 'select u.login, u.foto,c.texto,c.valoracion,c.fecha_hora from comentario c, usuario u where c.id_actividad=:ID_ACT and c.login=u.login order by fecha_hora desc';
                $VALORES = [];
            break;
        case 'categorias': // SE PIDEN LAS CATEGORIAS
                $mysql   = 'select c.id, c.nombre from categoria c, actividad_categoria ac where ac.id_categoria=c.id and ac.id_actividad=:ID_ACT order by nombre';
                $VALORES = [];
            break;
        case 'fotos': // SE PIDEN LAS FOTOS ASOCIADAS
                $mysql   = 'select * from foto where id_actividad=:ID_ACT';
                $VALORES = [];
            break;
        default: // SE PIDE TODA LA INFORMACIÓN
                $mysql .= ', a.descripcion, a.lugar ';
                $mysql .= ' FROM actividad a';
                $mysql .= ' where a.id=:ID_ACT';
                $info_completa = true; // Hay que devolver toda la información
            break;
    }
    $VALORES[':ID_ACT'] = $ID;
}
else if( count($PARAMS) > 0 ) {
    // INFORMACIÓN RELACIONADA CON TODOS LOS REGISTROS

    $mysql .= ' from actividad a where true ';

    // =================================================================================
    // SE AÑADE EL FILTRO EN FUNCIÓN DE LOS PARÁMETROS
    // =================================================================================
    $filtroSQL = aplicarFiltro($VALORES, $PARAMS);
    if($filtroSQL != ''){
        if(substr($filtroSQL,0, strlen(' having ')) == ' having ')
            $mysql .= $filtroSQL;
        else
            $mysql .= ' and' . $filtroSQL;
    }
    // =================================================================================
    // SE AÑADE EL ORDEN DE BÚSQUEDA
    // =================================================================================
    $mysql .= ' order by a.fecha_alta desc';
}
else {
    // SE AÑADE LA IMAGEN PARA MOSTRAR LOS DATOS DE TODOS LOS REGISTROS
    // $mysql .= ', (select archivo from foto f where f.idReceta=r.id order by id limit 1) as imagen FROM receta r';
    $mysql .= ' FROM actividad a';
    $mysql .= ' order by a.fecha_alta desc';
}

// =================================================================================
// SE CONSTRUYE LA PARTE DEL SQL PARA PAGINACIÓN
// =================================================================================
if(isset($PARAMS['reg']) && is_numeric($PARAMS['reg'])      // Página a listar
    && isset($PARAMS['cant']) && is_numeric($PARAMS['cant']))   // Tamaño de la página
{
    $SQL_PAGINACION   = ' LIMIT ' . $PARAMS['reg'] . ',' . $PARAMS['cant'];
    // =================================================================================
    // Para sacar el total de coincidencias que hay en la BD:
    // =================================================================================
    $RESPUESTA = $db->select($mysql, $VALORES);
    if($RESPUESTA['CORRECTO'])
    {
        $TOTAL_COINCIDENCIAS = count($RESPUESTA['RESULT']);
        $R['TOTAL_COINCIDENCIAS'] = count($RESPUESTA['RESULT']);
        $R['REG']  = $PARAMS['reg'];
        $R['CANT'] = $PARAMS['cant'];
    }

    $mysql .= $SQL_PAGINACION;
}

// =================================================================================
// SE HACE LA CONSULTA
// =================================================================================
// Se hace la petición con el sql preparado completo y sus parámetros, y se obtiene el resultado
$RESPUESTA = $db->select($mysql, $VALORES);
if( $RESPUESTA['CORRECTO'] ) { // execute query OK
    $RESPONSE_CODE  = 200;
    $R = ['RESULTADO' => 'OK'] + $R;
    $R['FILAS']     = $RESPUESTA['RESULT'];
}
else
{
    $RESPONSE_CODE    = 500;
    $R['RESULTADO']   = 'ERROR' ;
    $R['DESCRIPCION'] = 'Se ha producido un error en el servidor al ejecutar la consulta.';
    $R['ERROR']       = $RESULTADO['ERROR'];
}
$R = ['CODIGO'=>$RESPONSE_CODE] + $R;
// =================================================================================
// SE CIERRA LA CONEXION CON LA BD
// =================================================================================
$dbCon = null;
// =================================================================================
// SE DEVUELVE EL RESULTADO DE LA CONSULTA
// =================================================================================
http_response_code($RESPONSE_CODE);
echo json_encode($R);
?>
