import jwt from "jsonwebtoken";
export const Auth = async (req, res, next) => {
  // Obtén el token del header de autorización
  const authHeader = req.header("Authorization");

  // Verifica si hay un encabezado de autorización
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Acceso denegado. Token no proporcionado o inválido." });
  }

  try {
    // Extrae el token JWT eliminando el prefijo 'Bearer '
    const token = await authHeader.substring(7); // Longitud de 'Bearer ' es 7

    // Verifica y decodifica el token
    const decoded = await jwt.verify(token, "1234"); // Reemplaza 'tu_secreto' con tu propia clave secreta

    // Asigna el usuario decodificado al objeto de solicitud para que esté disponible en rutas protegidas
    req.user = decoded.user;

    // Continúa con la siguiente función de middleware o ruta
    next();
  } catch (error) {
    // Si hay un error en la verificación del token
    console.error("Error al verificar el token:", error);
    res.status(401).json({ message: "Token inválido." });
  }
};
