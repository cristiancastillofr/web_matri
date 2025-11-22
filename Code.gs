var SHEET_ID = "137PZjViOy531wJ8gxt5CC_jzDd_sbwsjjfCvfXjku1Q"; // Tu ID de hoja
var SHEET_NAME = "respuestas"; // Asegúrate que coincida con el nombre de la pestaña abajo a la izquierda

function doGet(e) {
  // Función para OBTENER el nombre y los cupos del invitado
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var idBuscado = e.parameter.id;
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    var data = sheet.getDataRange().getValues();
    
    var nombreEncontrado = "Invitado"; // Valor por defecto
    var cuposEncontrados = 1;         // Valor por defecto (mínimo 1)
    
    // Recorremos la hoja buscando el ID 
    // Columna A (data[i][0]): id
    // Columna B (data[i][1]): nombre
    // Columna C (data[i][2]): cupos_invitacion (¡NUEVO!)
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] == idBuscado) {
        nombreEncontrado = data[i][1];
        // Asegúrate de que el valor sea un número (si está vacío, usar 1)
        cuposEncontrados = parseInt(data[i][2]) || 1; 
        break;
      }
    }
    
    // Devolvemos ambos valores: nombre y cupos
    return ContentService.createTextOutput(JSON.stringify({ 
      result: "success", 
      nombre: nombreEncontrado,
      cupos: cuposEncontrados // <-- DEVOLVEMOS LOS CUPOS
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", error: e })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  // Función para GUARDAR la respuesta
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    var data = JSON.parse(e.postData.contents);
    var id = data.id;
    
    var rows = sheet.getDataRange().getValues();
    var rowIndex = -1;

    // Buscamos la fila del invitado
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] == id) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex > -1) {
      // OJO: Los índices de columna han cambiado debido a la inserción de 'cupos_invitacion' en C
      // La columna D (asistentes) ahora es el índice 4
      // La columna E (confirmacion) ahora es el índice 5
      // La columna F (restricciones) ahora es el índice 6
      // La columna G (mensaje) ahora es el índice 7
      // La columna H (fecha_respuesta) ahora es el índice 8
      var timestamp = new Date();
      sheet.getRange(rowIndex, 4).setValue(data.asistentes);         // D: asistentes
      sheet.getRange(rowIndex, 5).setValue(data.confirmacion);        // E: confirmacion
      sheet.getRange(rowIndex, 6).setValue(data.restricciones);       // F: restricciones
      sheet.getRange(rowIndex, 7).setValue(data.mensaje);             // G: mensaje
      sheet.getRange(rowIndex, 8).setValue(timestamp);                // H: fecha_respuesta
      
      return ContentService.createTextOutput(JSON.stringify({ result: "success", message: "Confirmación guardada" })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ result: "error", message: "ID no encontrado" })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", error: e })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}