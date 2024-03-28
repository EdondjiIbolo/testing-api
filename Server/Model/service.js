import "dotenv/config";
import fs from "node:fs";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const config = {
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  port: process.env.DB_PORT,
  database: process.env.MYSQLDATABASE,
  ssl: {
    ca: fs.readFileSync("./Server/ca.pem"),
  },
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
  }
  static async Userquote({ email, status }) {
    if (email && status) {
      try {
        const [searchId, i] = await connection.query(
          "SELECT id FROM usuarios WHERE email=?",
          [email]
        );
        const [{ id }] = searchId;

        const [quotes, _] = await connection.query(
          "SELECT quotations.*, usuarios.name , usuarios.phone FROM quotations JOIN usuarios ON usuarios.id  = ? AND status= ? ORDER BY quotations.quotation_date ASC",
          [id, status]
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
        "SELECT quotations.*, usuarios.name , usuarios.phone FROM quotations JOIN usuarios ON usuarios.id  = ? ORDER BY quotations.quotation_date ASC",
        [id]
      );
      return quotes;
    } catch (err) {
      console.log(err);
      return err;
    }
  }
  static async Assistantquote() {
    try {
      const [quotes, _] = await connection.query(
        "SELECT quotations.*, usuarios.name , usuarios.phone FROM quotations JOIN usuarios ON usuarios.id  = quotations.user_id ORDER BY quotations.quotation_date ASC"
      );
      return { quotes };
    } catch (err) {
      console.log(err);
      return err;
    }
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
  }
  static async Newquote({ email, file }) {
    // recuperar el id del usuario
    try {
      const [[idUser], _] = await connection.query(
        "SELECT id FROM usuarios WHERE email=?",
        [email]
      );
      const { userId } = idUser;
      const { id } = idUser;
      const date = Date.now();
      const newDate = new Date(date);

      const quoteId = crypto.randomUUID();
      const url = file.filename;

      const setQuote = await connection.query(
        "INSERT INTO quotations (id_quotation , user_id ,  fecha_quotation , url) VALUES (?,?,?,?)",
        [quoteId, id, newDate, url]
      );

      return { setQuote, quoteId };
    } catch (err) {
      console.log(err);
      return err;
    }
  }
  static async Singlequote({ id }) {
    try {
      const [[quoteData], _] = await connection.query(
        "SELECT * FROM quotations WHERE id_quotation=?",
        [id]
      );

      return quoteData;
    } catch (err) {
      return err;
    }
  }
  static async GetOrders({ id }) {
    try {
      const [[getUser], _] = await connection.query(
        "SELECT id from usuarios WHERE email = ?",
        [id]
      );
      const { id: userId } = getUser;

      const [getOrders, b] = await connection.query(
        "SELECT quotations.*, usuarios.name , usuarios.phone FROM quotations JOIN usuarios WHERE status = 'ordered' AND usuarios.id = ?",
        [userId]
      );

      return getOrders;
    } catch (err) {
      console.log(err);
    }
  }
  static async GetAsssistantOrders({ id }) {
    try {
      const [[getUser], _] = await connection.query(
        "SELECT id from usuarios WHERE email = ?",
        [id]
      );
      const { id: userId } = getUser;

      const [getOrders, b] = await connection.query(
        "SELECT quotations.*, usuarios.name , usuarios.phone FROM quotations JOIN usuarios ON usuarios.id  = ?  AND status = 'ordered'",
        [userId]
      );
      // const [getOrders, b] = await connection.query(
      //   "SELECT * from quotations WHERE user_id = ? AND status = 'ordered'",
      //   [userId]
      // );

      return getOrders;
    } catch (err) {
      console.log(err);
    }
  }
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
  }
}
