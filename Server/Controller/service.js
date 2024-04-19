import { ServiceModel } from "../Model/service.js";
import bcrypt from "bcrypt";
import readFile from "../service/service.js";
import fs from "fs/promises";
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
  static async getUserInfo(req, res) {
    const { email } = req.query;

    const result = await ServiceModel.getUserInfo({ email });
    if (!result) {
      return res.status(400).json({ error: "Error al recibir los datos" });
    }
    return res.status(201).json(result);
  }
  static async AccountSetting(req, res) {
    const validateData = validateUserlogin(req.body);
    if (validateData.error) {
      return res.status(400).json({ error: validateData.error.message });
    }
    const { phone, password } = validateData.data;
    const data = await ServiceModel.AccountSetting({ phone, password });

    if (data.token) return res.status(200).json(data);
    return res.status(401).json({
      error: "invalid user or password",
    });
  } //DONE
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
  //ASSISTANTS END POINTS

  static async updatemachine(req, res) {
    console.log(req.body);

    const { status, message, id } = req.body;

    const result = ServiceModel.updatemachine({ status, message, id });
    if (!result) {
      return res.status(400).json({ message: "error al actualizar los datos" });
    }
    return res
      .status(200)
      .json({ message: "Datos actualizados correctamente" });
  } //DONE
  static async UpdatePrice(req, res) {
    const { price, id } = req.body;

    const result = await ServiceModel.UpdatePrice({ price, id });

    if (result.err) {
      return res.status(404).json({
        message:
          "no se pudo actualizar los datos correctamente debido a un error",
      });
    }

    return res.status(200).json(result);
  }
  static async Assistantquote(req, res) {
    const quotes = await ServiceModel.Assistantquote();

    if (!quotes) {
      return res.status(400).json({ error: "error al recibir los datos" });
    }

    return res.status(200).json(quotes);
  } //Done
  static async GetAsssistantOrders(req, res) {
    const { email } = req.query;
    console.log(email);
    const result = await ServiceModel.GetAsssistantOrders({ email });
    console.log(result);
    if (result.err) {
      return res.status(404).json({ message: "Error al recibir los quotes" });
    }

    return res.status(200).json(result);
  }
  static async ShippingPrice(req, res) {
    const id = req.query;
    const info = req.body;
    const quotes = await ServiceModel.ShippingPrice({ id, info });

    if (quotes.err) {
      return res.status(400).json({ error: "error al actualizar los datos" });
    }
    return res.status(200).json(quotes);
  } //Done
  static async SubTotalQuotationPrice(req, res) {
    const info = req.body;
    console.log(info);
    const quotes = await ServiceModel.SubTotalQuotationPrice({ info });

    if (quotes.err) {
      return res.status(400).json({ error: "error al actualizar los datos" });
    }
    return res.status(200).json(quotes);
  } //Done
  static async TotalQuotationPrice(req, res) {
    const info = req.body;
    console.log(info);
    const quotes = await ServiceModel.TotalQuotationPrice({ info });

    if (quotes.err) {
      return res.status(400).json({ error: "error al actualizar los datos" });
    }
    return res.status(200).json(quotes);
  } //Done

  static async DonwloadFile(req, res) {
    const { file } = req.query;
    try {
      console.log(req.query);
      const filePath = file; // Replace with your file path
      const absolutePath = path.resolve(filePath);
      return res.download(absolutePath);
      // Verificar si el archivo existe antes de descargarlo
    } catch (err) {
      console.error("Error downloading file:", err);
      return res.status(500).send("Internal server error");
    }
  }

  ////customer end point
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
  //add more files to the part machine
  static async AddFiles(req, res, next) {
    const { id } = req.body;
    const orderId = id;

    if (!req.files) {
      return res
        .status(400)
        .json({ error: "No se ha recibido ningun archivo" });
    }

    const files = req.files;

    const result = await ServiceModel.AddFiles({ orderId, files });
    console.log(result);
    if (result?.err) {
      return res.status(400).json({ message: "Error al crear la quotation" });
    }
    return res.status(200).json({ message: "Files Added Successfully" });
  } //DONE
  //create a new quote
  static async Newquote(req, res, next) {
    const { email } = req.body;

    if (!req.files) {
      return res
        .status(400)
        .json({ error: "No se ha recibido ningun archivo" });
    }

    const files = req.files;

    const result = await ServiceModel.Newquote({ email, files });

    if (result?.err) {
      return res.status(400).json({ message: "Error al crear la quotation" });
    }
    return res.status(200).json(result);
  } //DONE
  //get all quotes (user/customer)
  static async Userquote(req, res) {
    const { email, status } = req.query;

    if (email && status) {
      const quotes = await ServiceModel.Userquote({ email, status });
      if (!quotes) {
        return res.status(400).json({ error: "error al recibir los datos" });
      }

      return res.status(200).json({ quotes });
    } else if (email) {
      const quotes = await ServiceModel.Userquote({ email });
      if (quotes?.err) {
        console.log("quotes");
        return res.status(401).json({ error: "error al recibir los datos" });
      }
      console.log(quotes);
      return res.status(200).json({ quotes });
    }
  } //Done
  //get a single quotes (user/customer)
  static async SingleQuote(req, res) {
    console.log(req.query);
    const { quote: quote_id, file: file_id } = req.query;

    if (quote_id && file_id) {
      const result = await ServiceModel.SingleFile({ quote_id, file_id });
      return res.status(200).json(result);
    } else if (!file_id) {
      const result = await ServiceModel.Singlequote({ quote_id });
      return res.status(200).json(result);
    }

    if (!result) {
      return res.status(400).json({ error: "Error al buscar la quote" });
    }
    res.status(200).json(result);
  } //DONE

  static async ReceiveFile(req, res) {
    const { id } = req.params;
    console.log(req.params);
    const result = await ServiceModel.receiveFile({ id });
    const url = result?.file_url;
    if (!url) {
      res.status(404).json({ message: "Archivo no encontrado" });
    }
    const filePath = await `./${url}`;
    const absolutePath = path.resolve(filePath);
    return res.sendFile(absolutePath);
  } //DONE
  //delete a file
  static async deleteFile(req, res) {
    const { quote, file } = req.query;
    const id = quote;
    const result = await ServiceModel.deleteFile({ id, file });
    console.log(result);
    if (!result) {
      return res.status(404).json({ message: "Error al recibir los quotes" });
    }

    return res.status(200).json(result);
  }
  //end point data for landing page
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

  /////
  static async updateStatus(req, res) {
    const { status } = req.query;
    const data = req.body;

    if (status) {
      const result = await ServiceModel.updateStatus({ data });
      console.log(result);
      if (result.err) {
        return res.status(404).json({
          message:
            "no se pudo actualizar los datos correctamente debido a un error",
        });
      }
      return res.status(200).json(result);
    }
  }
  static async QuoteRequest(req, res) {
    const data = req.body;

    const result = await ServiceModel.QuoteRequest({ data });
    console.log("25252");
    if (result.err) {
      return res.status(404).json({
        message:
          "no se pudo actualizar los datos correctamente debido a un error",
      });
    }
    return res.status(200).json(result);
  }

  /////
  static async UpdateQuoteFile(req, res) {
    const data = { ...req.body };
    console.log(data);
    const files = req.files?.map((file) => {
      const data = {
        path: file.path,
        name: file.filename,
      };
      return data;
    });

    const result = await ServiceModel.UpdateQuoteFile({ data, files });
    console.log(result);
    if (result.err) {
      return res.status(404).json({
        message:
          "no se pudo actualizar los datos correctamente debido a un error",
      });
    }

    return res.status(200).json(result);
  }
  /////
  static async GetOrders(req, res) {
    const { id } = req.query;
    const result = await ServiceModel.GetOrders({ id });
    console.log(result);
    if (result.err) {
      return res.status(404).json({ message: "Error al recibir los quotes" });
    }

    return res.status(200).json(result);
  } //revisar si se necesita
  static async CustomerQuotes(req, res) {
    const { email } = req.query;
    const result = await ServiceModel.CustomerQuotes({ email });
    console.log(result);
    if (result?.err) {
      return res.status(404).json({ message: "Error al recibir los quotes" });
    }

    return res.status(200).json(result);
  }
}
