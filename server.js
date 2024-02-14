const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const app = express();
const upload = multer({ dest: "uploads/" });
const shortid = require("shortid");

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const workbook = xlsx.readFile(req.file.path);

  const sheetName = workbook.SheetNames[0]; //selecting sheetName which are present in file
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet); //extracting data from the sheet in the form of  array of objects

  const headers = Object.keys(data[0]);

  // Validate the format of the Excel file
  for (let elements of data) {
    elements.emp_id = shortid.generate();
    let errorFound = false;
    if (
      elements.emp_name === undefined ||
      elements.emp_name === null ||
      (typeof elements.emp_name === "string" && elements.emp_name.trim() === "")
    ) {
      elements["error"] = `${
        elements.error ? elements.error + "," : ""
      }  Name Required`;
      errorFound = true;
    } else {
      if (!/^[a-zA-Z]+(?: [a-zA-Z]+)*$/.test(elements.emp_name)) {
        elements["error"] = `${
          elements.error ? elements.error + "," : ""
        }  Invalid Name`;
        errorFound = true;
      }
    }

    if (typeof elements.age !== "number") {
      elements["error"] = `${
        elements.error ? elements.error + "," : ""
      }  Age Required`;
      errorFound = true;
    } else {
      if (elements.age <= 18 || elements.age >= 80) {
        elements["error"] = `${
          elements.error ? elements.error + "," : ""
        }  Invalid Age`;
        errorFound = true;
      }
    }

    if (typeof elements.mobile !== "number") {
      elements["error"] = `${
        elements.error ? elements.error + "," : ""
      }  Mobile Required`;
      errorFound = true;
    } else {
      if (!/^\d{9,13}$/.test(elements.mobile)) {
        elements["error"] = `${
          elements.error ? elements.error + "," : ""
        } Invalid MobileNo`;
        errorFound = true;
      }
    }

    if (typeof elements.gender !== "string") {
      elements["error"] = `${
        elements.error ? elements.error + "," : ""
      } Gender Required`;
      errorFound = true;
    } else {
      if (!["Male", "Female", "Other"].includes(elements.gender)) {
        elements["error"] = `${
          elements.error ? elements.error + "," : ""
        } Invalid Gender`;
        errorFound = true;
      }
    }

    if (!["Sales", "Marketing", "Hr", "IT"].includes(elements.dept_name)) {
      elements["error"] = `${
        elements.error ? elements.error + "," : ""
      } Dept Doesn't Exist`;
      errorFound = true;
    }

    if (!errorFound) {
      elements["status"] = "Success";
    } else {
      elements["status"] = "failled";
    }
  }

  const folderPath = path.join(__dirname, "responses"); //creating new folder with name responses
  if (!fs.existsSync(folderPath)) {
    //checking folder exist of not
    fs.mkdirSync(folderPath);
  }

  // Create a new Excel file inside the folder
  const newWorkbook = xlsx.utils.book_new(); //creating new empty workbook
  const newDataSheet = xlsx.utils.json_to_sheet(data); //creating excel worksheet using json data
  xlsx.utils.book_append_sheet(newWorkbook, newDataSheet, "Sheet1");

  const outputFile = path.join(folderPath, "response.xlsx");

  // Write the new Excel file to disk
  xlsx.writeFile(newWorkbook, outputFile);

  res.status(200).json({ message: "Data uploaded successfully" });

  fs.unlinkSync(req.file.path); // Remove the uploaded file from uploads folder
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
