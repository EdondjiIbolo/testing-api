const express = require("express");
const fs = require("fs");
const archiver = require("archiver");

const app = express();

// Ruta para descargar el archivo ZIP
app.get("/descargar-archivos", async (req, res) => {
  try {
    // Lista de archivos a incluir en el ZIP
    const archivos = ["archivo1.txt", "archivo2.txt", "archivo3.txt"];

    // Configurar el stream de salida hacia el cliente
    res.attachment("archivos.zip");
    const zipStream = archiver("zip");
    zipStream.pipe(res);

    // Agregar cada archivo al ZIP
    archivos.forEach((archivo) => {
      zipStream.append(fs.createReadStream(archivo), { name: archivo });
    });

    // Finalizar el ZIP y enviar al cliente
    zipStream.finalize();
  } catch (error) {
    console.error("Error al crear el archivo ZIP:", error);
    res.status(500).send("Error interno del servidor");
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
