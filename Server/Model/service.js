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
      const [getAssistant, Arow] = await connection.query(
        "SELECT name , email , phone FROM assistants"
      );
      const assistant = getAssistant[0];
      console.log(assistant);
      const [user] = getUser;

      if (!user.id) {
        throw new Error("User Not found");
      }
      return { user, assistant };
    } catch (error) {
      console.log(error);
    }
  }
  static async AccountSetting({ info, email }) {
    const { name, surename, password, company } = info;

    try {
      const [querdata, _] = await connection.query(
        "SELECT * FROM usuarios WHERE email = ? ",
        [email]
      );

      if (querdata.length <= 0) {
        throw new Error("User not found");
      }
      const updatePassword = await connection.query(
        "UPDATE usuarios SET password = ? , name = ?, surename=? , email =?, company=? WHERE email = ?",
        [password, name, surename, email, company, email]
      );
      if (updatePassword.affectedRows === 0) {
        throw new Error("Failed to update password");
      }

      return updatePassword;
    } catch (err) {
      console.log(err);
      return { err };
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
  static async AssistantLogin({ phone, password }) {
    console.log("hola");
    try {
      const [querdata, _] = await connection.query(
        "SELECT phone, password , rol_id FROM assistants WHERE phone = ? AND password = ?",
        [phone, password]
      );
      console.log(querdata);
      const response = await querdata;
      if (response.length <= 0) {
        throw new Error("Wrong password or telephone number");
      }

      const [userInfo, row] = await connection.query(
        "SELECT * FROM assistants WHERE phone = ?",
        [phone]
      );

      const [user] = userInfo;
      console.log(user);
      if (!user.name) {
        throw new Error("Usuario no encontrado");
      }
      if (user.rol_id !== 1) {
        throw new Error("No authorized");
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
      return { err };
    }
  }
  static async AssistantInfo({ email }) {
    try {
      const [getAssistant, Arow] = await connection.query(
        "SELECT name , email , phone FROM assistants WHERE email=?",
        [email]
      );
      const assistant = getAssistant[0];
      console.log(assistant);
      const [user] = getUser;

      if (!assistant.id) {
        throw new Error("Assistant account Not found");
      }
      return { assistant };
    } catch (error) {
      console.log(error);
      return { err };
    }
  }
  static async AssistantSetting({ info, email }) {
    const { name, phone, password } = info;

    try {
      const [querdata, _] = await connection.query(
        "SELECT * FROM assistants WHERE email = ? ",
        [email]
      );

      if (querdata.length <= 0) {
        throw new Error("Assistant not found not found");
      }
      const updatePassword = await connection.query(
        "UPDATE assistants SET password = ? , name = ?,  email =?, phone=? WHERE email = ?",
        [password, name, email, phone, email]
      );
      if (updatePassword.affectedRows === 0) {
        throw new Error("Failed to update password");
      }

      return updatePassword;
    } catch (err) {
      console.log(err);
      return { err };
    }
  }
  static async updatemachine({ status_message, id }) {
    try {
      const insertdata = await connection.query(
        "UPDATE files_details SET  status_message = ? WHERE file_id = ? ",
        [status_message, id]
      );
      console.log(insertdata);
      return insertdata;
    } catch (err) {
      console.log(err);
      return err;
    }
  }
  static async updateOrderStatus({ status_message, id, status }) {
    try {
      const insertdata = await connection.query(
        "UPDATE orders SET  status_message = ? , sub_status = ? WHERE id = ? ",
        [status_message, status, id]
      );
      if (insertdata.affectedRows <= 0) {
        throw new Error("Ups, Error updating the data");
      }
      console.log(insertdata);
      return insertdata;
    } catch (err) {
      console.log(err);
      return err;
    }
  }
  static async SetQuoteMessage({ id, info }) {
    const { status_message } = info;

    const quoteId = id.id;
    try {
      const [quotes, _] = await connection.query(
        "UPDATE  orders  set status_message= ?  where id = ?",
        [status_message, quoteId]
      );

      return { quotes };
    } catch (err) {
      console.log(err);
      return { err };
    }
  }
  static async ShippingPrice({ id, info }) {
    const { shipping_price } = info;
    console.log(info);
    const quoteId = id.id;
    try {
      const [quotes, _] = await connection.query(
        "UPDATE  orders  set  shipping_price=? where id = ?",
        [shipping_price, quoteId]
      );

      return { quotes };
    } catch (err) {
      console.log(err);
      return { err };
    }
  }
  static async TotalQuotationPrice({ info }) {
    const { email, orderId } = info;

    try {
      const [[userRole], rows] = await connection.query(
        "SELECT rol_id FROM assistants WHERE email=?",
        [email]
      );
      const { rol_id } = await userRole;
      if (rol_id === 3) {
        throw new Error(
          "Unauthorized , you dont have permission to make changes"
        );
      }
      const [[getTotal], row] = await connection.query(
        "SELECT sub_total, shipping_price, (sub_total + shipping_price) AS total FROM orders where id = ? ",
        [orderId]
      );

      if (!getTotal) {
        throw new Error("Error al calcular el  precio total");
      }
      const { total } = getTotal;

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
        "SELECT rol_id FROM assistants WHERE email=?",
        [email]
      );
      const { rol_id } = await userRole;
      if (rol_id === 3) {
        throw new Error(
          "Unauthorized , you dont have permission to make changes"
        );
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
  static async Assistantquote({ email }) {
    try {
      const [verufyUser, _] = await connection.query(
        "SELECT * FROM assistants WHERE email =?",
        [email]
      );
      const [user] = verufyUser;
      console.log(user);
      if (user.rol_id !== 1) {
        throw new Error("Unauthorized , Frobidden Page");
      }
    } catch (err) {
      console.log(err);
      return { err };
    }

    try {
      const [quotes, _] = await connection.query(
        "SELECT orders.*, usuarios.name, usuarios.phone, COUNT(files.id) AS total_parts FROM orders JOIN usuarios ON usuarios.id = orders.user_id LEFT JOIN  files ON files.order_id = orders.id WHERE orders.status != 'ordered'  GROUP BY orders.id, usuarios.id, usuarios.name, usuarios.phone ORDER BY orders.date ASC"
      );

      return { quotes };
    } catch (err) {
      console.log(err);
      return { err };
    }
  }
  static async AssistantHelp({ data }) {
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
    console.log(quantity);

    try {
      const [[getUser], _] = await connection.query(
        "SELECT * from assistants WHERE email = ?",
        [user]
      );
      if (!getUser.id) {
        throw new Error(
          "Unauthorized , you dont have permission to make changes"
        );
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
      console.log(values);
      const UpdateFile = await connection.query(
        "UPDATE files_details SET technology = ? , material = ? ,material_feature = ? , finishing = ? , threads = ? , tolerance = ?, roughness=? , notes = ? , quantity = ? WHERE order_id = ? AND file_id = ?",
        values
      );

      const date = Date.now();
      const newDate = new Date(date);
      const UpdateQuoteDate = await connection.query(
        "UPDATE orders SET date = ? , status = ? WHERE id = ? ",
        [newDate, "uploaded", order_id]
      );

      //usar el rest operator para poner todos los datos en un nuevo objeto y
      return { message: "Datos actualizados correctamente" };
    } catch (err) {
      console.log(err);
      return { err };
    }
  }
  //this one is for update files_Details price
  static async UpdatePrice({ price, id }) {
    try {
      const [setData, _] = await connection.query(
        "UPDATE files_details SET unit_price = ? WHERE file_id = ?",
        [price, id]
      );
      const [updateTotalPrice, updtPriceRow] = await connection.query(
        "UPDATE files_details SET price = quantity * unit_price WHERE file_id = ?",
        [id]
      );

      console.log("Datos actualizados correctamente");
      //usar el rest operator para poner todos los datos en un nuevo objeto y
      return { message: "Datos actualizados correctamente" };
    } catch (err) {
      console.log(err);
      return { err };
    }
  } //done
  static async DownLoadFiles({ id }) {
    try {
      const [[getImportantFile], improw] = await connection.query(
        "SELECT filename FROM files_details WHERE id =?",
        [id]
      );
      const [getFiles, row] = await connection.query(
        "SELECT file_name FROM other_files WHERE file_id =?",
        [id]
      );
      const impfileortantFile = getImportantFile.filename;

      const files = [...getFiles, { file_name: impfileortantFile }];

      return files;
    } catch (err) {
      console.log(err);
      return { err };
    }
  }
  static async GetAsssistantOrders({ email }) {
    try {
      const [verufyUser, _] = await connection.query(
        "SELECT * FROM assistants WHERE email =?",
        [email]
      );
      const [user] = verufyUser;
      console.log(user);
      if (user.rol_id !== 1) {
        throw new Error("Unauthorized , Frobidden Page");
      }
    } catch (err) {
      console.log(err);
      return { err };
    }
    try {
      const [getOrders, b] = await connection.query(
        "SELECT orders.*, usuarios.name, usuarios.phone, COUNT(files.id) AS total_parts FROM orders JOIN usuarios ON orders.user_id = usuarios.id LEFT JOIN files ON files.order_id = orders.id WHERE  orders.status = 'ordered' GROUP BY  orders.id, usuarios.id, usuarios.name, usuarios.phone ORDER BY   orders.date ASC"
      );

      return getOrders;
    } catch (err) {
      console.log(err);
      return { err };
    }
  } //Done

  //Customer
  static async Userquote({ email, status }) {
    try {
      const [searchId, i] = await connection.query(
        "SELECT id FROM usuarios WHERE email=? ",
        [email]
      );

      const [{ id }] = searchId;

      const [quotes, _] = await connection.query(
        "select count(files.id) as total_parts ,orders.user_id, orders.id ,  orders.date , orders.shipping_price , orders.total_price, orders.status_message , orders.status from files join orders on orders.id = files.order_id  AND orders.user_id = ? AND orders.status != 'ordered'  group by orders.id",
        [id]
      );

      return quotes;
    } catch (err) {
      console.log(err);
      return { err };
    }
  } //Done recive all quotes-customer
  static async AddFiles({ orderId, files }) {
    // recuperar el id del usuario

    try {
      const fileId = crypto.randomUUID();
      const updateOrderStatus = await connection.query(
        "UPDATE orders SET  status = ? WHERE id=?",
        ["uploaded", orderId]
      );
      if (updateOrderStatus.affectedRows <= 0) {
        throw new Error("Error updating status");
      }
      function generateNumericUUID(letter) {
        const timestamp = new Date().getTime(); // Obtener el timestamp actual
        const randomNumber = Math.floor(Math.random() * 100000); // Número aleatorio de 6 dígitos
        // Concatenar el timestamp y el número aleatorio para formar el UUID
        const numericUUID = `${letter}-${timestamp}${randomNumber}`;

        return numericUUID; // Convertir el UUID a un número entero
      }
      for (let i = 0; i < files.length; i++) {
        const fileId = generateNumericUUID("F");
        const insert = await connection.query(
          "INSERT INTO files (id , order_id, filename , file_url) VALUES (?,?,?,?)",
          [fileId, orderId, files[i].filename, files[i].path]
        );
        if (!insert) {
          throw new Error("Error adding new File");
        }
        const fd_id = generateNumericUUID("FD");
        const status = "uploaded";
        const message =
          "  Please proceed with a manual quote request. You can also split parts to different quotes for faster quoting.";
        const insert_fd = await connection.query(
          "INSERT INTO files_details (id , order_id, file_id,filename , status,status_message) VALUES (?,?,?,?,?,?)",
          [fd_id, orderId, fileId, files[i].filename, status, message]
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
  } //done : Add more files(machine parts) to a quotation
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

      function generateNumericUUID(letter) {
        const timestamp = new Date().getTime(); // Obtener el timestamp actual
        const randomNumber = Math.floor(Math.random() * 100000); // Número aleatorio de 6 dígitos
        // Concatenar el timestamp y el número aleatorio para formar el UUID
        const numericUUID = `${letter}-${timestamp}${randomNumber}`;

        return numericUUID; // Convertir el UUID a un número entero
      }

      // Ejemplo de uso:
      const orderId = generateNumericUUID("Q");

      const status = "uploaded";
      const message =
        "  Please proceed with a manual quote request. You can also split parts to different quotes for faster quoting.";
      const setQuote = await connection.query(
        "INSERT INTO orders (id , user_id ,date,status ,status_message ) VALUES (?,?,?,?,?)",
        [orderId, id, newDate, status, message]
      );
      for (let i = 0; i < files.length; i++) {
        const fileId = generateNumericUUID("F");
        const insert = await connection.query(
          "INSERT INTO files (id , order_id, filename , file_url  ) VALUES (?,?,?,?)",
          [fileId, orderId, files[i].filename, files[i].path]
        );
        const fd_id = generateNumericUUID("FD");
        const insert_fd = await connection.query(
          "INSERT INTO files_details (id , order_id, file_id, filename, status , status_message ) VALUES (?,?,?,?,?,?)",
          [fd_id, orderId, fileId, files[i].filename, status, message]
        );
      }
      return { setQuote, orderId };
    } catch (err) {
      console.log(err);
      return { err };
    }
  } //done ： create a new quotation uploading files
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
  } //done : get a singgle quote info
  static async SingleFile({ quote_id, file_id }) {
    console.log("aaaaaa");
    try {
      const [[quotedata], _] = await connection.query(
        "SELECT  DISTINCT  files_details.id , files_details.file_id, files_details.order_id,files_details.filename , files_details.technology,files_details.roughness ,files_details.material , files_details.material_feature , files_details.finishing, files_details.tolerance ,files_details.threads ,files_details.quantity , files_details.notes ,files_details.price,files_details.unit_price  , files_details.status FROM files_details   inner join files on files.order_id = ? WHERE files_details.file_id = ?",
        [quote_id, file_id]
      );

      const [quoteFiles, rows] = await connection.query(
        "SELECT file_url , file_name as name FROM other_files where part_id=?",
        [file_id]
      );
      const [getOrderStatus, fila] = await connection.query(
        "SELECT sub_status FROM orders where id=?",
        [quote_id]
      );
      const [orderStatus] = getOrderStatus;
      const quoteData = {
        quotedata,
        quoteFiles,
        orderStatus,
      };
      console.log(quoteData);

      return quoteData;
    } catch (err) {
      console.log(err);
      return err;
    }
  } //done : get a single machine part info
  static async updateStatus({ data }) {
    const { status, id, sub_status } = data;
    try {
      //  p
      const date = Date.now();
      const newDate = new Date(date);
      const message =
        "我们正在等待您的付款以处理您的订单。请尽快完成付款以加快处理过程。谢谢";
      const [setData, _] = await connection.query(
        "UPDATE orders SET  date = ? , status = ? , status_message = ? , sub_status=? WHERE id = ?",
        [newDate, status, message, sub_status, id]
      );
      const updateFilesStatus = await connection.query(
        "UPDATE files_details SET status='ordered' WHERE order_id=?",
        [id]
      );
      console.log("Datos actualizados correctamente");
      //usar el rest operator para poner todos los datos en un nuevo objeto y
      return { message: "Datos actualizados correctamente" };
    } catch (err) {
      console.log(err);
      return { err };
    }
  } //actualiza la quotation : fecha, addres
  static async HelpRequest({ id }) {
    try {
      console.log(id);

      const text = "help";
      const status = "quoting";
      const nullValue = null;
      const [setData, _] = await connection.query(
        "UPDATE orders SET sub_status = ? , total_price=?, shipping_price=? , sub_total=? ,status = ? WHERE id = ?",
        [text, status, nullValue, nullValue, nullValue, id]
      );
      console.log("Datos actualizados correctamente");

      return { message: "Datos actualizados correctamente" };
    } catch (err) {
      console.log(err);
      return { err };
    }
  } // done : usuario pide ayuda para revisar su quotation
  static async QuoteRequest({ data }) {
    const { shipping_date, date, address, id } = data;
    console.log(data);

    try {
      //  p
      const date = Date.now();
      const newDate = new Date(date);
      const phone = address?.split("/")[2];
      const message = "Please wait for the Manual Quote";
      console.log(phone);
      const [updateFiles, row] = await connection.query(
        "UPDATE files_details SET  status = 'quoting' WHERE order_id = ?",
        [id]
      );
      const [setData, _] = await connection.query(
        "UPDATE orders SET address = ? ,shipping_date = ? , phone = ? , date = ? , status = 'quoting' , status_message = ? WHERE id = ?",
        [address, shipping_date, phone, newDate, message, id]
      );

      console.log("Datos actualizados correctamente");

      return { message: "Datos actualizados correctamente" };
    } catch (err) {
      console.log(err);
      return { err };
    }
  } //actualiza la quotation : fecha, addres
  static async UpdateQuoteFile({ data, files }) {
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
      fd_id,
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

      console.log(file_id);

      const UpdateFile = await connection.query(
        "UPDATE files_details SET technology = ? , material = ? ,material_feature = ? , finishing = ? , threads = ? , tolerance = ?, roughness=? , notes = ? ,quantity = ? WHERE order_id = ? AND file_id = ? ",
        values
      );
      for (const file of files) {
        console.log(file_id);
        try {
          const { filename, path } = file;
          const id = crypto.randomUUID();
          // Realiza la inserción en la tabla 'other_files' usando la conexión 'connection'
          const insertResult = await connection.query(
            "INSERT INTO other_files (id, file_name, file_url, file_id,part_id) VALUES (?, ?, ?, ?, ?)",
            [id, filename, path, fd_id, file_id]
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
        "UPDATE orders SET date = ? , status = ? WHERE id = ? ",
        [newDate, "uploaded", order_id]
      );

      //usar el rest operator para poner todos los datos en un nuevo objeto y
      return { message: "Datos actualizados correctamente" };
    } catch (err) {
      console.log(err);
      return { err };
    }
  } // no tocar: actualiza el file de una quotation : file, finishing, etc
  static async deleteQuote({ id }) {
    const orderId = id;

    try {
      // eliminar de tabla files details
      const [infoDeleteFileData] = await connection.query(
        "DELETE  from files_details WHERE order_id = ? ",
        [orderId]
      );
      // eliminar de tabla files
      const [infoDeleteFile] = await connection.query(
        "DELETE  from files WHERE order_id = ?",
        [orderId]
      );
      const [infoDeleteOrder] = await connection.query(
        "DELETE  from orders WHERE  id=?",
        [orderId]
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
  } // no tocar : Delete one  one quotation
  static async deleteFile({ filesDelete }) {
    try {
      // eliminar de tabla files details
      const Delete = filesDelete.map(async (file) => {
        const [infoDeleteFileData] = await connection.query(
          "DELETE  from files_details WHERE id = ? ",
          [file]
        );
        if (!infoDeleteFileData) {
          throw new Error("Error al borrar los datos en la tabla files");
        }
      });

      // eliminar de tabla files
      // const [infoDeleteFile] = await connection.query(
      //   "DELETE  from files WHERE order_id = ? AND id=?",
      //   [orderId, fileId]
      // );
      // if (!infoDeleteFile) {
      //   throw new Error("Error al borrar los datos en la tabla files");
      // }

      // if (!infoDeleteFileData) {
      //   throw new Error("Error al borrar los datos en la tabla files details");
      // }
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
        "select count(files.id) as total_parts ,orders.user_id, orders.id ,  orders.date , orders.shipping_price ,orders.total_price , orders.status_message , orders.status  , orders.sub_status from files join orders on orders.id = files.order_id  AND orders.user_id = ? AND orders.status = 'ordered' group by orders.id",
        [userId]
      );
      console.log(getOrders);
      return getOrders;
    } catch (err) {
      console.log(err);
      return { err };
    }
  } //done : devuelve los Orders de un usuario

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

  static async GetOrders({ id }) {
    try {
      const [[getUser], _] = await connection.query(
        "SELECT id from usuarios WHERE email = ?",
        [email]
      );
      const { id: userId } = getUser;
      console.log(userId);
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
  } //revisar para borrar
}
