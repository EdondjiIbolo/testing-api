import { ServiceModel } from "../Model/service.js";
import bcrypt from "bcrypt";
import readFile from "../service/service.js";
import fs from "node:fs";
import archiver from "archiver";
import path from "path";

const { data: dataInfo } = readFile("../mock/info-mock.json");
import {
  validateUserSignin,
  validateUserlogin,
  validateDataMessage,
  validateQuotationScheme,
  validateDataAssistance,
} from "../schema/userSchema.mjs";
import { sendVerifyCode } from "../service/mail.mjs";

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
    const info = req.body;
    const { email } = req.query;

    const data = await ServiceModel.AccountSetting({ info, email });
    if (data?.err) {
      return res.status(401).json({
        error: "invalid user or password",
      });
    }
    return res.status(200).json({
      message: "Updated Successfully",
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
  static async AssistantLogin(req, res) {
    const validateData = validateUserlogin(req.body);
    console.log(validateData);
    if (validateData.error) {
      return res.status(400).json({ error: validateData.error.message });
    }
    const { phone, password } = validateData.data;
    const data = await ServiceModel.AssistantLogin({ phone, password });
    if (data.err) {
      return res.status(401).json({
        error: data.err,
      });
    }
    return res.status(200).json(data);
  }
  static async AssistantInfo(req, res) {
    const { email } = req.query;

    const result = await ServiceModel.AssistantInfo({ email });
    if (result?.err) {
      return res.status(400).json({ error: result?.err });
    }
    return res.status(201).json(result);
  }
  static async AssistantSetting(req, res) {
    const info = req.body;
    const { email } = req.query;

    const data = await ServiceModel.AssistantSetting({ info, email });
    if (data?.err) {
      return res.status(401).json({
        error: "invalid user or password",
      });
    }
    return res.status(200).json({
      message: "Updated Successfully",
    });
  }
  static async updatemachine(req, res) {
    console.log(req.body);

    const { status_message, id } = req.body;

    const result = ServiceModel.updatemachine({ status_message, id });
    if (!result) {
      return res.status(400).json({ message: "error al actualizar los datos" });
    }
    return res
      .status(200)
      .json({ message: "Datos actualizados correctamente" });
  } //DONE
  static async updateOrderStatus(req, res) {
    console.log(req.body);

    const { status_message, id, status } = req.body;

    const result = ServiceModel.updateOrderStatus({
      status_message,
      id,
      status,
    });
    if (!result) {
      return res.status(400).json({ message: "error al actualizar los datos" });
    }
    return res
      .status(200)
      .json({ message: "Datos actualizados correctamente" });
  } //DONE
  static async AssistantHelp(req, res) {
    const data = req.body;

    const result = await ServiceModel.AssistantHelp({ data });
    if (result?.err) {
      return res.status(404).json({
        message:
          "no se pudo actualizar los datos correctamente debido a un error",
      });
    }
    return res.status(200).json(result);
  }
  //this one is for update files_Details price
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
    const { email } = req.query;
    const quotes = await ServiceModel.Assistantquote({ email });

    if (quotes?.err) {
      return res.status(401).json({ error: quotes?.err });
    }

    return res.status(200).json(quotes);
  } //Done
  static async GetAsssistantOrders(req, res) {
    const { email } = req.query;
    console.log(email);
    const result = await ServiceModel.GetAsssistantOrders({ email });
    console.log(result);
    if (result.err) {
      return res.status(401).json({ message: "Error al recibir los quotes" });
    }

    return res.status(200).json(result);
  }
  static async SetQuoteMessage(req, res) {
    const id = req.query;
    const info = req.body;

    const quotes = await ServiceModel.SetQuoteMessage({ id, info });

    if (quotes.err) {
      return res.status(400).json({ error: "error al actualizar los datos" });
    }
    return res.status(200).json(quotes);
  }
  static async ShippingPrice(req, res) {
    const id = req.query;
    const info = req.body;
    console.log(info);
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
  //Download  a sigle file of a machine part
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
  //Download multipleas files for a machine part
  static async DownLoadFiles(req, res) {
    const { id } = req.query;
    const directorioArchivos = "Server/uploads/";
    const result = await ServiceModel.DownLoadFiles({ id });
    if (result?.err) {
      return res.status(400).json({ message: "Error" });
    }
    console.log(result);
    try {
      // Configurar el stream de salida hacia el cliente
      res.attachment(`${id}.zip`);
      const zipStream = archiver("zip");
      zipStream.pipe(res);

      result?.forEach((archivo) => {
        const rutaArchivo = path.join(directorioArchivos, archivo?.file_name);

        const fileName = archivo?.file_name.split("-")[1];
        zipStream.append(fs.createReadStream(rutaArchivo), {
          name: fileName,
        });
      });

      // Finalizar el ZIP y enviar al cliente
      zipStream.finalize();
    } catch (error) {
      console.error("Error al crear el archivo ZIP:", error);
      res.status(500).send("Error interno del servidor");
    }
  }

  ////customer end point

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
  static async deleteQuote(req, res) {
    const { quote } = req.query;
    const id = quote;
    const result = await ServiceModel.deleteQuote({ id });
    console.log(result);
    if (!result) {
      return res.status(404).json({ message: "Error al recibir los quotes" });
    }

    return res.status(200).json(result);
  }
  static async deleteFile(req, res) {
    const { filesDelete } = req.body;
    console.log(filesDelete);

    const result = await ServiceModel.deleteFile({ filesDelete });
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

    if (result.err) {
      return res.status(404).json({
        message:
          "no se pudo actualizar los datos correctamente debido a un error",
      });
    }
    return res.status(200).json(result);
  }
  static async HelpRequest(req, res) {
    const { id } = req.query;

    const result = await ServiceModel.HelpRequest({ id });
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
    const files = req.files;
    console.log(data);
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
