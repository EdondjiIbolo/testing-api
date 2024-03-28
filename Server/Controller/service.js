import { ServiceModel } from "../Model/service.js";
import bcrypt from "bcrypt";
import readFile from "../service/service.js";

const { data: dataInfo } = readFile("../mock/info-mock.json");
import {
  validateUserSignin,
  validateUserlogin,
  validateDataMessage,
  validateQuotationScheme,
  validateDataAssistance,
} from "../schema/userSchema.mjs";
import { sendVerifyCode } from "../service/mail.mjs";
import path from "path";
import { fileURLToPath } from "url";

export class ServiceController {
  static async GetInfo(req, res) {
    const { email } = req.query;
    const quotes = await ServiceModel.GetInfo({ email });
    return res.status(200).json({ quotes });
  }
  static async recoverPassword(req, res) {
    const validateData = validateUserlogin(req.body);
    if (validateData.error) {
      return res.status(400).json({ message: validateData.error.message });
    }
    const { phone, password, verifyCode } = validateData.data;
    const result = await ServiceModel.recoverPassword({
      phone,
      password,
      verifyCode,
    });

    if (result.err) {
      return res.status(400).json({
        message: "Error Codigo invalido o numero incorrecto",
      });
    }

    return res
      .status(200)
      .json({ message: "Password have changed successfully" });
  }
  static async logInUser(req, res) {
    const validateData = validateUserlogin(req.body);
    if (validateData.error) {
      return res.status(400).json({ error: validateData.error.message });
    }
    const { phone, password } = validateData.data;
    const data = await ServiceModel.logInUser({ phone, password });

    if (data.token) return res.status(200).json(data);
    return res.status(401).json({
      error: "invalid user or password",
    });
  } //DONE
  static async signAccountUser(req, res) {
    // validar
    const validateData = validateUserSignin(req.body);
    console.log(validateData.error);
    if (validateData.error) {
      return res.status(400).json({ error: validateData.error.message });
    }
    const { name, username, email, password, phone, rol, verifyCode } =
      validateData.data;
    const input = {
      name,
      username,
      email,
      password,
      phone,
      rol,
      verifyCode,
    };
    const result = await ServiceModel.signAccountUser({ input });
    console.log(result);
    if (!result) {
      return res.status(400).json({ message: "Error al crear cuenta" });
    }

    return res.status(201).json(result);
  }
  static async newMessage(req, res) {
    const Validatedata = validateDataMessage(req.body);
    if (Validatedata.error) {
      return res.status(400).json({ error: Validatedata.error.message });
    }
    const date = Date.now();
    const newDate = new Date(date);
    const input = Validatedata.data;
    const result = ServiceModel.newMessage({ input, newDate });
    const data = await result;
    console.log(data);
    if (data.err) {
      res.status(400).json({ message: "Error al enviar al sms" });
    }
    res.status(200).json({ message: "Message sent successfully" });
  }
  static async SendVerificationCode(req, res) {
    const { phone } = req.body;
    const { otpCode } = await sendVerifyCode(phone);

    // verificar el codigo y almacenarlo DB
    console.log(otpCode);
    const saltRounds = 10;
    const myPlaintextPassword = otpCode;
    const salt = bcrypt.genSaltSync(saltRounds);
    const encriptedCode = bcrypt.hashSync(myPlaintextPassword, salt);
    const result = await ServiceModel.SendVerificationCode({
      encriptedCode,
      phone,
    });
    console.log(result, "hola", phone);
    if (!result) {
      return res.status(400).json({ message: "Error al verificar el numero" });
    }

    return res.status(200).json(result);
  }
  static async AssistantChange(req, res) {
    const validateData = validateDataAssistance(req.body);
    console.log(req.body);
    const { status, price, id } = validateData.data;
    console.log(validateData);
    const result = ServiceModel.AssistantChange({ status, price, id });
    if (!result) {
      return res.status(400).json({ message: "error al actualizar los datos" });
    }
    return res
      .status(200)
      .json({ message: "Datos actualizados correctamente" });
  } //DONE
  static async Sendquote(req, res) {
    const validateData = validateQuotationScheme(req.body);

    if (validateData.error) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    const { data } = validateData;
    const result = await ServiceModel.Sendquote({ data });

    if (!result) {
      return res.status(400).json({ error: "Error al crear el quote" });
    }
    console.log(result);
    return res
      .status(200)
      .json({ message: "QUOTED CREATED SUCCESSFULLY", ...result });
  } //DONE
  static async Newquote(req, res, next) {
    const { email } = req.body;
    console.log("aquiiiiii");
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "No se ha recibido ningun archivo" });
    }
    const file = req.file;
    const result = await ServiceModel.Newquote({ email, file });
    if (result) {
      return res.status(200).json(result);
      next();
    }
    return res.status(400).json({ message: "Error al crear la quotation" });
  } //DONE
  static async Userquote(req, res) {
    const { email, status } = req.query;
    console.log(req.query);
    if (email && status) {
      const quotes = await ServiceModel.Userquote({ email, status });
      if (!quotes) {
        return res.status(400).json({ error: "error al recibir los datos" });
      }
      console.log(quotes);

      return res.status(200).json({ quotes });
    } else if (email) {
      const quotes = await ServiceModel.Userquote({ email });
      console.log(quotes);
      if (!quotes) {
        return res.status(400).json({ error: "error al recibir los datos" });
      }
      console.log(quotes);
      return res.status(200).json({ quotes });
    }
  } //Done
  static async Assistantquote(req, res) {
    const quotes = await ServiceModel.Assistantquote();
    console.log(quotes);
    if (!quotes) {
      return res.status(400).json({ error: "error al recibir los datos" });
    }

    return res.status(200).json(quotes);
  } //Done
  static async SingleQuote(req, res) {
    const { id } = req.params;
    const result = await ServiceModel.Singlequote({ id });
    console.log(result);
    if (!result) {
      return res.status(400).json({ error: "Error al buscar la quote" });
    }
    res.status(200).json(result);
  } //DONE
  static async ReceiveFile(req, res) {
    const { id } = req.params;
    const filePath = `./Server/uploads/${id}`;
    return res.download(filePath);
  } //DONE
  static async GetData(req, res) {
    const { data, lang } = req.query;

    if (data === "material") {
      if (lang === "ch") {
        const { materialsInfo_ch } = dataInfo;
        return res.status(200).send(materialsInfo_ch);
      }

      const { materialsInfo_en } = dataInfo;

      return res.status(200).send(materialsInfo_en);
    }
    if (data === "finishing") {
      if (lang === "ch") {
        const { finishingsInfo_ch } = dataInfo;
        return res.status(200).send(finishingsInfo_ch);
      }
      const { finishingsInfo_en } = dataInfo;

      return res.status(200).send(finishingsInfo_en);
    }

    console.log(dataInfo);
    return res.status(200).json({ dataInfo });
  }
  static async GetOrders(req, res) {
    const { id } = req.query;
    const result = await ServiceModel.GetOrders({ id });
    console.log(result);
    if (!result) {
      return res.status(404).json({ message: "Error al recibir los quotes" });
    }

    return res.status(200).json(result);
  }
}
