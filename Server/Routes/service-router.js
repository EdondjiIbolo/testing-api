import { Router } from "express";
import { ServiceController } from "../Controller/service.js";
import multer from "multer";

const PORT = process.env.PORT || 3000;

export const serviceRouter = Router();
const storage = multer.diskStorage({
  destination: "./Server/uploads",
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });
serviceRouter.get("/panel-info", ServiceController.GetInfo);
serviceRouter.post("/login", ServiceController.logInUser);
serviceRouter.post("/verify", ServiceController.SendVerificationCode);
serviceRouter.post("/sign-up", ServiceController.signAccountUser);
serviceRouter.post("/message-contact", ServiceController.newMessage);
serviceRouter.post("/recover", ServiceController.recoverPassword);
serviceRouter.post("/account-setting", ServiceController.AccountSetting);
serviceRouter.post("/account-info", ServiceController.getUserInfo);
////
serviceRouter.post("/order", ServiceController.updateStatus);

/////
//Assistant
serviceRouter.post("/assistant-changes", ServiceController.AssistantChange);
serviceRouter.post("/update-part-status", ServiceController.updatemachine);
serviceRouter.post("/update-price", ServiceController.UpdatePrice);
serviceRouter.get("/assistant-quote", ServiceController.Assistantquote);
serviceRouter.get("/assistant-orders", ServiceController.GetAsssistantOrders);
serviceRouter.post("/shipping_price", ServiceController.ShippingPrice);
serviceRouter.post(
  "/update-total_price",
  ServiceController.TotalQuotationPrice
);
serviceRouter.post(
  "/update-subtotal_price",
  ServiceController.SubTotalQuotationPrice
);
serviceRouter.get("/download-file", ServiceController.DonwloadFile);
//end point de abajo -> price update
serviceRouter.get("/customer-quote", ServiceController.Userquote);
serviceRouter.post("/send-quote", ServiceController.Sendquote);
serviceRouter.post("/update-order", ServiceController.Quoteupdate);

serviceRouter.get("/file/:id", ServiceController.ReceiveFile);
serviceRouter.get("/quote", ServiceController.SingleQuote);
serviceRouter.delete("/quote", ServiceController.deleteFile);
serviceRouter.get("/data", ServiceController.GetData);
serviceRouter.get("/my-orders", ServiceController.GetOrders); //revisar si se ncita
serviceRouter.get("/customers-orders", ServiceController.CustomerQuotes);
///no tocar

serviceRouter.patch(
  "/update-file",
  upload.array("files"),
  ServiceController.UpdateQuote
);
serviceRouter.post(
  "/new-quote",
  upload.array("files"),
  ServiceController.Newquote
);
serviceRouter.patch(
  "/add-files",
  upload.array("files"),
  ServiceController.AddFiles
);
