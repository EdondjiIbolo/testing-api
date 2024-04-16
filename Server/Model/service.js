import "dotenv/config";
import fs from "node:fs";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { query } from "express";

const config = {
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  port: process.env.DB_PORT,
  database: process.env.MYSQLDATABASE,
  // ssl: {
  //   ca: fs.readFileSync("./Server/ca.pem"),
  // },
};

const connection = await mysql.createConnection(config);

export class ServiceModel {
  static async recoverPassword({ phone, password, verifyCode }) {
    //verificar el codigo de verificacion
    try {
      const [querydata, a] = await connection.query(
        "SELECT phone, codigo FROM tokens WHERE phone = ?",
        [phone]
      );
      if (!querydata) {
        throw new Error("No se ha podido enviar el codigo");
      }
      const inputUser = verifyCode;
      const [codeValidate] = querydata.filter((data) => {
        const code = data.codigo;

        //comparar codigos
        const isValid = bcrypt.compareSync(inputUser, code);
        if (!isValid) {
          return;
        }
        return data;
      });
      if (!codeValidate) {
        throw new Error("Codigo invalido");
      }
      const [userData, _] = await connection.query(
        "SELECT * FROM usuarios WHERE phone = ?",
        [phone]
      );
      const [data] = userData;

      const userPhone = data?.phone;
      if (!userPhone) {
        throw new Error("Numero de telefono no encontrado");
      }
      const changePassword = await connection.query(
        "UPDATE  usuarios SET password = ? WHERE phone = ?",
        [password, phone]
      );
      // const userForToken = {
      //   id: data.id,
      //   password: data.password,
      // };
      // const token = jwt.sign(userForToken, "1234", { expiresIn: "3d" });
      // console.log(data);
      // const userDataToken = {
      //   name: data.name,
      //   username: data.surename,
      //   email: data.email,
      //   token,
      // };
      return true;
    } catch (err) {
      return { err };
    }
  }
  static async getUserInfo({ email }) {
    try {
      const [getUser, row] = await connection.query(
        "SELECT * FROM usuarios WHERE email = ?",
        [email]
      );
      const [user] = getUser;
      if (!user.id) {
        throw new Error("User Not found");
      }
      return user;
    } catch (error) {
      console.log(error);
    }
  }
  static async AccountSetting({ phone, password }) {
    try {
      const [querdata, _] = await connection.query(
        "SELECT * FROM usuarios WHERE phone = ? ",
        [phone]
      );

      if (response.length <= 0) {
        throw new Error("User not found");
      }
      const updatePassword = await connection.query(
        "UPDATE usuarios SET password = ?  WHERE phone = ?",
        [password, phone]
      );
      if (updateResult.affectedRows === 0) {
        throw new Error("Failed to update password");
      }

      return data;
    } catch (err) {
      console.log(err);
      return err;
    }
  }
  static async logInUser({ phone, password }) {
    console.log("hola");
    try {
      const [querdata, _] = await connection.query(
        "SELECT phone, password FROM usuarios WHERE phone = ? AND password = ?",
        [phone, password]
      );
      console.log(querdata);
      const response = await querdata;
      if (response.length <= 0) {
        throw new Error("Wrong password or telephone number");
      }
      const userInfo = await connection.query(
        "SELECT * FROM usuarios WHERE phone = ?",
        [phone]
      );

      const [user] = userInfo[0];

      if (!user) {
        throw new Error("Usuario no encontrado");
      }

      const userForToken = {
        id: user.id,
        password: user.password,
      };
      const token = jwt.sign(userForToken, "1234", { expiresIn: "3d" });
      const data = {
        name: user.name,
        username: user.surename,
        email: user.email,
        token,
      };

      return data;
    } catch (err) {
      console.log(err);
      return err;
    }
  }
  static async signAccountUser({ input }) {
    const { name, username, email, password, phone, rol, verifyCode } = input;
    console.log(input);
    //manerjar el error
    try {
      const [querdata, _] = await connection.query(
        "SELECT phone, codigo FROM tokens WHERE phone = ?",
        [phone]
      );

      const inputUser = verifyCode;
      const codeValidate = querdata.filter((data) => {
        const code = data.codigo;
        //comparar codigos
        const isValid = bcrypt.compareSync(inputUser, code);
        console.log(isValid);
        if (isValid) return data;
      });

      if (!codeValidate[0]) {
        throw new Error("El código no es válido");
      }

      //    Revisar si el usuario ya existe en la base de datos.
      const [isUserExist, tableInfo] = await connection.query(
        "SELECT * FROM usuarios WHERE phone = ?",
        [phone]
      );

      //Verificar si el usuario ya existe para enviar un enviar un error
      if (isUserExist[0]) {
        throw new Error("El usuario ya existe");
      }
      // si el suario no existe crearle una nueva cuenta y enviar el token
      const id = crypto.randomUUID();
      const user = {
        id,
        name,
        username,
        email,
        password,
        rol,
        phone,
      };

      const insertdata = await connection.query(
        "INSERT INTO usuarios (id, name, surename, email, password, rol_id,phone) VALUES (?,?,?,?,?,?,?)",
        [id, name, username, email, password, rol, phone]
      );
      if (!insertdata) {
        throw new Error("Error al crear la cuenta");
      }
      const userForToken = {
        id: user.id,
        password: user.password,
      };
      const token = jwt.sign(userForToken, "1234", { expiresIn: "3d" });
      const data = {
        name: user.name,
        username: user.username,
        email: user.email,
        token,
      };

      return data;
    } catch (err) {
      console.log(err);
      return err;
    }
  } //DONE
  static async newMessage({ input, newDate }) {
    const { name, surename, email, companyName, phone, message, check } = input;
    try {
      const insertMessage = await connection.query(
        "INSERT INTO messages ( name, surename, email, company , phone ,message, want_update ,fecha_message) VALUES (?,?,?,?,?,?,?,?)",
        [name, surename, email, companyName, phone, message, check, newDate]
      );

      return insertMessage;
    } catch (err) {
      return { err };
    }
  }
  static async SendVerificationCode({ encriptedCode, phone }) {
    try {
      const tokenId = crypto.randomUUID();
      const insertdata = await connection.query(
        "INSERT INTO tokens (token_id , phone, codigo , fecha ) VALUES (?,?,? , NOW())",
        [tokenId, phone, encriptedCode]
      );
      if (!insertdata) {
        throw new Error("Error al almacenar el codigo de verificacion");
      }
      return insertdata;
    } catch (err) {
      console.log(err);
      return err;
    }
  } //DONE
  //Assistant
  static async AssistantChange({ status, price, id }) {
    console.log(price, id, status);
    try {
      const insertdata = await connection.query(
        "UPDATE quotations SET price = ? , status = ? WHERE id_quotation = ? ",
        [price, status, id]
      );
      console.log(insertdata);
      return insertdata;
    } catch (err) {
      console.log(err);
      return err;
    }
  } //hay que arreglar aqui
  static async updatemachine({ status, message, id }) {
    try {
      const insertdata = await connection.query(
        "UPDATE files_details SET status = ? , status_message = ? WHERE file_id = ? ",
        [status, message, id]
      );
      console.log(insertdata);
      return insertdata;
    } catch (err) {
      console.log(err);
      return err;
    }
  }
  static async ShippingPrice({ id, info }) {
    const { status, shipping_price } = info;
    const quoteId = id.id;
    try {
      // const [quotes, _] = await connection.query(
      //   "SELECT quotations.*, usuarios.name , usuarios.phone FROM quotations JOIN usuarios ON usuarios.id  = quotations.user_id ORDER BY quotations.quotation_date ASC"
      // );
      const [quotes, _] = await connection.query(
        "UPDATE  orders  set shipping_price=? , status=? where id = ?",
        [shipping_price, status, quoteId]
      );
      // const [updateQuote, row] = await connection.query(
      //   "INSERT INTO orders (id, total_price) SELECT a.id, SUM(a.price) AS subtotal_price FROM files_details a where a.order_id=? GROUP BY a.id",
      //   [quoteId]
      // );

      return { quotes };
    } catch (err) {
      console.log(err);
      return { err };
    }
  }
  static async TotalQuotationPrice({ info }) {
    const { email, orderId } = info;
    //revisar si el usuario tiene permisos para realiar cambios
    //obtener el rol id

    try {
      const [[userRole], rows] = await connection.query(
        "SELECT rol_id FROM usuarios WHERE email=?",
        [email]
      );
      const { rol_id } = await userRole;
      if (rol_id === 3) {
        throw new Error("Permiso denegado");
      }
      const [[getTotal], row] = await connection.query(
        "SELECT sub_total, shipping_price, (sub_total + shipping_price) AS total FROM orders where id = ? ",
        [orderId]
      );

      if (!getTotal) {
        throw new Error("Error al calcular el  precio total");
      }
      const { total } = getTotal;

      // const insert = await connection.query(
      //   "UPDATE  orders SET total_price = ? WHERE id = ?",
      //   [total, orderId]
      // );
      const insert = await connection.query(
        "UPDATE orders SET total_price = ? , status = 'quoted' WHERE id = ?",
        [total, orderId]
      );
      return insert;
      console.log(orderId);
    } catch (err) {
      console.log(err);
      return { err };
    }
  }
  static async SubTotalQuotationPrice({ info }) {
    const { price, email, status, orderId } = info;
    //revisar si el usuario tiene permisos para realiar cambios
    //obtener el rol id
    console.log(orderId);
    try {
      const [[userRole], rows] = await connection.query(
        "SELECT rol_id FROM usuarios WHERE email=?",
        [email]
      );
      const { rol_id } = await userRole;
      if (rol_id === 3) {
        throw new Error("Permiso denegado");
      }
      const [[getTotal], row] = await connection.query(
        "SELECT SUM(files_details.price) as total FROM files_details where order_id = ? ",
        [orderId]
      );
      console.log(orderId);
      if (!getTotal) {
        throw new Error("Error al calcular el sub precio");
      }
      const { total } = getTotal;
      const insert = await connection.query(
        "UPDATE  orders SET sub_total = ? where id = ?",
        [total, orderId]
      );
    } catch (err) {
      console.log(err);
      return { err };
    }

    try {
      const [quotes, _] = await connection.query(
        "UPDATE  orders  set total_price=? , status=? where id = ?",
        [price, status, orderId]
      );
      return { quotes };
    } catch (err) {
      console.log(err);
      return { err };
    }
  }
  static async Assistantquote() {
    try {
      const [quotes, _] = await connection.query(
        "SELECT orders.*, usuarios.name, usuarios.phone, COUNT(files.id) AS total_parts FROM orders JOIN usuarios ON usuarios.id = orders.user_id LEFT JOIN  files ON files.order_id = orders.id WHERE orders.status = 'waiting for price' OR  orders.status = 'quoted' OR orders.status = 'files uploaded' GROUP BY orders.id, usuarios.id, usuarios.name, usuarios.phone ORDER BY orders.date ASC"
      );

      return { quotes };
    } catch (err) {
      console.log(err);
      return err;
    }
  }
  static async UpdatePrice({ price, id }) {
    try {
      const [setData, _] = await connection.query(
        "UPDATE files_details SET price = ? WHERE file_id = ?",
        [price, id]
      );

      console.log("Datos actualizados correctamente");
      //usar el rest operator para poner todos los datos en un nuevo objeto y
      return { message: "Datos actualizados correctamente" };
    } catch (err) {
      console.log(err);
      return { err };
    }
  } //done
  static async GetAsssistantOrders({ email }) {
    try {
      const [[getUser], _] = await connection.query(
        "SELECT id , rol_id from usuarios WHERE email = ?",
        [email]
      );
      const { rol_id } = await getUser;
      if (rol_id === 3) {
        throw new Error("Permiso denegado");
      }
      const { id: userId } = getUser;

      const [getOrders, b] = await connection.query(
        "SELECT orders.*, usuarios.name , usuarios.phone FROM orders JOIN usuarios ON  status = 'ordered'",
        [userId]
      );

      // const [getOrders, b] = await connection.query(
      //   "SELECT * from quotations WHERE user_id = ? AND status = 'ordered'",
      //   [userId]
      // );

      return getOrders;
    } catch (err) {
      console.log(err);
      return { err };
    }
  } //revisar a  medias

  //Customer
  static async Userquote({ email, status }) {
    if (email && status) {
      try {
        const [searchId, i] = await connection.query(
          "SELECT id FROM usuarios WHERE email=?",
          [email]
        );
        const [{ id }] = searchId;

        // const [quotes, _] = await connection.query(
        //   "SELECT quotations.*, usuarios.name , usuarios.phone FROM quotations JOIN usuarios ON usuarios.id  = ? AND status= ? ORDER BY quotations.quotation_date ASC",
        //   [id, status]
        // );

        const [quotes, _] = await connection.query(
          "SELECT * FROM orders where orders.id  = ?",
          [id]
        );

        return quotes;
      } catch (err) {
        console.log(err);
        return err;
      }
    }

    try {
      const [searchId, i] = await connection.query(
        "SELECT id FROM usuarios WHERE email=? ",
        [email]
      );
      const [{ id }] = searchId;

      const [quotes, _] = await connection.query(
        "select count(files.id) as total_parts ,orders.user_id, orders.id ,  orders.date , orders.shipping_price ,orders.total_price , orders.status from files join orders on orders.id = files.order_id  AND orders.user_id = ? group by orders.id",
        [id]
      );

      return quotes;
    } catch (err) {
      console.log(err);
      return { err };
    } //Done recive all quotes-customer
  }
  static async Sendquote({ data }) {
    console.log(data);

    const {
      quantity,
      Technology,
      Material,
      Finishing,
      Tolerance,
      Roughness,
      Threads,
      lead_time,
      name,
      username,
      shipping_date,
      address,
      email,
      token,
      Quotation_id,
    } = data;
    console.log(data);

    const date = Date.now();
    const newDate = new Date(date);
    try {
      const [[userId], _] = await connection.query(
        "SELECT id FROM usuarios WHERE email= ?",
        [email]
      );
      const { id } = userId;

      const insertQuote = await connection.query(
        "UPDATE quotations SET technology = ? , material = ? , finishing = ? , tolerance = ? , threads = ? , lead_time = ? , address = ? , quantity = ? , quotation_Date = ?,   note = ? , shipping_date = ? WHERE   id_quotation = ? ",
        [
          Technology,
          Material,
          Finishing,
          Tolerance,
          Threads,
          lead_time,
          address,
          quantity,
          newDate,
          "none",
          shipping_date,
          Quotation_id,
        ]
      );

      return insertQuote;
    } catch (err) {
      console.log(err);

      return err;
    }
  } //Revisar : urgente
  static async AddFiles({ orderId, files }) {
    // recuperar el id del usuario

    try {
      const fileId = crypto.randomUUID();

      for (let i = 0; i < files.length; i++) {
        const fileId = crypto.randomUUID();
        const insert = await connection.query(
          "INSERT INTO files (id , order_id, filename , url_3d) VALUES (?,?,?,?)",
          [fileId, orderId, files[i].filename, files[i].path]
        );
        if (!insert) {
          throw new Error("Error adding new File");
        }
        const fd_id = crypto.randomUUID();
        const insert_fd = await connection.query(
          "INSERT INTO files_details (id , order_id, file_id,filename) VALUES (?,?,?,?)",
          [fd_id, orderId, fileId, files[i].filename]
        );
        if (!insert) {
          throw new Error("Error adding new File info");
        }
      }

      return { message: "Files added successfully" };
    } catch (err) {
      console.log(err);
      return { err };
    }
  } //done
  static async Newquote({ email, files }) {
    // recuperar el id del usuario
    try {
      const [[idUser], _] = await connection.query(
        "SELECT id FROM usuarios WHERE email=?",
        [email]
      );

      const { userId } = await idUser;
      const { id } = idUser;
      const date = Date.now();
      const newDate = new Date(date);

      const orderId = crypto.randomUUID();
      const status = "files uploaded";
      const setQuote = await connection.query(
        "INSERT INTO orders (id , user_id ,date , status ) VALUES (?,?,? , ?)",
        [orderId, id, newDate, status]
      );

      for (let i = 0; i < files.length; i++) {
        const fileId = crypto.randomUUID();
        const insert = await connection.query(
          "INSERT INTO files (id , order_id, filename , file_url ) VALUES (?,?,?,?)",
          [fileId, orderId, files[i].filename, files[i].path]
        );
        const fd_id = crypto.randomUUID();
        const insert_fd = await connection.query(
          "INSERT INTO files_details (id , order_id, file_id, filename ) VALUES (?,?,?,?)",
          [fd_id, orderId, fileId, files[i].filename]
        );
      }

      return { setQuote, orderId };
    } catch (err) {
      console.log(err);
      return { err };
    }
  } //done
  static async Singlequote({ quote_id }) {
    console.log("aaaaaa");
    console.log(quote_id);
    try {
      const [quotesData, _] = await connection.query(
        "SELECT *  FROM files_details WHERE files_details.order_id =  ?  ",
        [quote_id]
      );
      const [[orderData], b] = await connection.query(
        "SELECT *  FROM orders  WHERE id = ? ",
        [quote_id]
      );

      const quoteData = {
        quotes: [...quotesData],
        orderInfo: { ...orderData },
      };
      console.log(quoteData);
      return quoteData;
    } catch (err) {
      console.log(err);
      return err;
    }
  } //done
  static async SingleFile({ quote_id, file_id }) {
    console.log("aaaaaa");
    try {
      const [[quotedata], _] = await connection.query(
        "SELECT  DISTINCT  files_details.id , files_details.file_id, files_details.filename , files_details.technology,files_details.roughness ,files_details.material , files_details.material_feature , files_details.finishing, files_details.tolerance ,files_details.threads ,files_details.quantity , files_details.notes ,files_details.price  FROM files_details   inner join files on files.order_id = ? WHERE files_details.file_id = ?",
        [quote_id, file_id]
      );
      const [quoteFiles, rows] = await connection.query(
        "SELECT file_url , file_name as name FROM other_files where file_id=?",
        [file_id]
      );
      const quoteData = {
        quotedata,
        quoteFiles,
      };
      console.log(quoteData);

      return quoteData;
    } catch (err) {
      console.log(err);
      return err;
    }
  } //done
  static async updateStatus({ data }) {
    const { status, id } = data;
    try {
      //  p
      const date = Date.now();
      const newDate = new Date(date);

      const [setData, _] = await connection.query(
        "UPDATE orders SET  date = ? , status = ? WHERE id = ?",
        [newDate, status, id]
      );
      console.log("Datos actualizados correctamente");
      //usar el rest operator para poner todos los datos en un nuevo objeto y
      return { message: "Datos actualizados correctamente" };
    } catch (err) {
      console.log(err);
      return { err };
    }
  } //actualiza la quotation : fecha, addres
  static async Quoteupdate({ data }) {
    const { shipping_date, date, address, id } = data;
    console.log(data);

    try {
      //  p
      const date = Date.now();
      const newDate = new Date(date);
      const phone = address?.split("/")[2];
      console.log(phone);
      const [setData, _] = await connection.query(
        "UPDATE orders SET address = ? ,shipping_date = ? , phone = ? , date = ? , status = 'waiting for price' WHERE id = ?",
        [address, shipping_date, phone, newDate, id]
      );
      console.log("Datos actualizados correctamente");
      //usar el rest operator para poner todos los datos en un nuevo objeto y
      return { message: "Datos actualizados correctamente" };
    } catch (err) {
      console.log(err);
      return { err };
    }
  } //actualiza la quotation : fecha, addres
  static async UpdateQuote({ data, files }) {
    const {
      Technology,
      Material,
      MaterialFeature,
      Finishing,
      Tolerance,
      Roughness,
      Threads,
      notes,
      user,
      order_id,
      file_id,
      quantity,
    } = data;

    try {
      const [[getUser], _] = await connection.query(
        "SELECT * from usuarios WHERE email = ?",
        [user]
      );
      if (!getUser.id) {
        throw new Error("User Not found");
      }
      const values = [
        Technology,
        Material,
        MaterialFeature,
        Finishing,
        Threads,
        Tolerance,
        Roughness,
        notes,
        quantity,
        order_id,
        file_id,
      ];
      const UpdateQuoteFile = await connection.query(
        "UPDATE files_details SET technology = ? , material = ? ,material_feature = ? , finishing = ? , threads = ? , tolerance = ?, roughness=? , notes = ? ,quantity = ? WHERE order_id = ? AND file_id = ? ",
        values
      );
      for (const file of files) {
        console.log(file_id);
        try {
          const { name, path } = file;
          const id = crypto.randomUUID();
          // Realiza la inserción en la tabla 'other_files' usando la conexión 'connection'
          const insertResult = await connection.query(
            "INSERT INTO other_files (id, file_name, file_url, file_id) VALUES (?, ?, ?, ?)",
            [id, name, path, file_id]
          );

          // Manejo de resultado de la inserción si es necesario
          console.log(
            `Inserción exitosa en other_files para file_id: ${file_id}`
          );
        } catch (error) {
          console.error(
            `Error al insertar en other_files para file_id: ${file_id}`,
            error
          );
          // Manejo de errores aquí (lanzar una excepción o manejar de otra manera)
          return { err };
        }
      }

      const date = Date.now();
      const newDate = new Date(date);
      const UpdateQuoteDate = await connection.query(
        "UPDATE orders SET date = ? , status = 'waiting' WHERE id = ? ",
        [newDate, order_id]
      );

      //usar el rest operator para poner todos los datos en un nuevo objeto y
      return { message: "Datos actualizados correctamente" };
    } catch (err) {
      console.log(err);
      return { err };
    }
  } // no tocar: actualiza el file de una quotation : file, finishing, etc
  static async deleteFile({ id, file }) {
    const orderId = id;
    const fileId = file;

    try {
      // eliminar de tabla files details
      const [infoDeleteFileData] = await connection.query(
        "DELETE  from files_details WHERE order_id = ? AND file_id=?",
        [orderId, fileId]
      );
      // eliminar de tabla files
      const [infoDeleteFile] = await connection.query(
        "DELETE  from files WHERE order_id = ? AND id=?",
        [orderId, fileId]
      );
      if (!infoDeleteFile) {
        throw new Error("Error al borrar los datos en la tabla files");
      }

      if (!infoDeleteFileData) {
        throw new Error("Error al borrar los datos en la tabla files details");
      }
      const message = "Datos borrados correctamente";

      //usar el rest operator para poner todos los datos en un nuevo objeto y
      return { message };
    } catch (err) {
      console.log(err);
    }
  } // no tocar : Delete one machine part of one quotation
  ///
  static async CustomerQuotes({ email }) {
    try {
      const [[getUser], _] = await connection.query(
        "SELECT id from usuarios WHERE email = ?",
        [email]
      );

      const userId = getUser.id;
      if (!userId) {
        throw new Error("Usuario no encontrado");
      }
      const [getOrders, b] = await connection.query(
        "SELECT orders.*, usuarios.name , usuarios.phone FROM orders JOIN usuarios ON usuarios.id  = ?  AND status = 'ordered'",
        [userId]
      );

      return getOrders;
    } catch (err) {
      console.log(err);
      return { err };
    }
  } //done : devuelve los quotes de un usuario
  static async GetOrders({ id }) {
    try {
      const [[getUser], _] = await connection.query(
        "SELECT id from usuarios WHERE email = ?",
        [email]
      );
      const { id: userId } = getUser;

      const [getOrders, b] = await connection.query(
        "SELECT orders.*, usuarios.name , usuarios.phone FROM quotations JOIN usuarios ON usuarios.id  = ?  AND status = 'ordered'",
        [userId]
      );
      // const [getOrders, b] = await connection.query(
      //   "SELECT * from quotations WHERE user_id = ? AND status = 'ordered'",
      //   [userId]
      // );

      return getOrders;
    } catch (err) {
      console.log(err);
      return { err };
    }
  } //revisar
  static async receiveFile({ id }) {
    try {
      const [[getUser], _] = await connection.query(
        "SELECT file_url from files_details WHERE file_id = ?",
        [id]
      );
      const fileData = getUser;
      console.log(fileData);

      //usar el rest operator para poner todos los datos en un nuevo objeto y
      return fileData;
    } catch (err) {
      console.log(err);
      return { err };
    }
  } //revisar
  static async GetInfo({ email }) {
    try {
      const [[getUser], _] = await connection.query(
        "SELECT id from usuarios WHERE email = ?",
        [email]
      );
      const { id } = getUser;
      const [quotes, qtd] = await connection.query(
        "SELECT * from quotations WHERE user_id = ? ",
        [id]
      );

      //usar el rest operator para poner todos los datos en un nuevo objeto y
      return quotes;
    } catch (err) {
      console.log(err);
    }
  } //revisar
}
