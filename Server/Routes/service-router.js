import { Router } from "express";
import { ServiceController } from "../Controller/service.js";
import multer from "multer";
import { AuthMiddleware } from "../Middleware/auth.js";

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

///
serviceRouter.post(
  "/account-setting",

  ServiceController.AccountSetting
);
serviceRouter.get("/account-info", ServiceController.getUserInfo);
serviceRouter.post("/order", ServiceController.updateStatus);

//Assistant

serviceRouter.post("/login-assistant", ServiceController.AssistantLogin);
serviceRouter.get("/account-assistant-info", ServiceController.AssistantInfo);
serviceRouter.post(
  "/account-assistant-setting",
  ServiceController.AssistantSetting
);
serviceRouter.post("/update-part-status", ServiceController.updatemachine);
serviceRouter.post("/update-order-status", ServiceController.updateOrderStatus);
serviceRouter.post("/update-price", ServiceController.UpdatePrice);
serviceRouter.get("/assistant-quote", ServiceController.Assistantquote);
serviceRouter.get("/assistant-orders", ServiceController.GetAsssistantOrders);
serviceRouter.post("/assistant-help", ServiceController.AssistantHelp);
serviceRouter.post("/shipping_price", ServiceController.ShippingPrice);
serviceRouter.post("/quote-message", ServiceController.SetQuoteMessage);
serviceRouter.post(
  "/update-total_price",
  ServiceController.TotalQuotationPrice
);
serviceRouter.post(
  "/update-subtotal_price",
  ServiceController.SubTotalQuotationPrice
);
serviceRouter.get("/download-file", ServiceController.DonwloadFile);
serviceRouter.get("/download-files", ServiceController.DownLoadFiles);
//end point de abajo -> price update
serviceRouter.get("/customer-quote", ServiceController.Userquote);
// serviceRouter.post("/send-quote", ServiceController.Sendquote);
serviceRouter.post("/request-quote", ServiceController.QuoteRequest);
serviceRouter.post("/request-help", ServiceController.HelpRequest);

serviceRouter.get("/file/:id", ServiceController.ReceiveFile);
serviceRouter.get("/quote", ServiceController.SingleQuote);
serviceRouter.delete("/quote", ServiceController.deleteFile);
serviceRouter.delete("/delete-quote", ServiceController.deleteQuote);
serviceRouter.get("/data", ServiceController.GetData);
serviceRouter.get("/my-orders", ServiceController.GetOrders); //revisar si se ncita
serviceRouter.get("/customers-orders", ServiceController.CustomerQuotes);
///no tocar

serviceRouter.patch(
  "/update-file",
  upload.array("files"),
  ServiceController.UpdateQuoteFile
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
