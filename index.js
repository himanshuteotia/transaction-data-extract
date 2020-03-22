const cheerio = require('cheerio') // this is nodejs library to traversing/manipulating the resulting data structure ( https://github.com/cheeriojs/cheerio ) 
const fs = require("fs"); // this module to read the files from disk ( file system )

// function to read the HTML file from the current directory 
function fileread(filename) {
   var contents = fs.readFileSync(filename);
   return contents;
}

var html_data = fileread("bankstatement.html");
const $ = cheerio.load(html_data) // load the HTML file as a object in $
let str = ""; // this variable is to save every line string
let bankStatementDetails = {  // this object is to save all the data that we required at the end
   nameOfCustomer: "",
   addressOfCustomer: "",
   bankAccountNumber: "",
   statementDate: "",
   transactions: []
};

let transaction = {   // this object will track the individual transaction 
   "date": "",
   "description": "",
   "transaction_type": "",
   "amount": ""
}
let transactionTrack = true; // this variable is to track list of transations and once it finished set it to false
let b = 0, l = 0, r = 0, t = 0; // these are variables to track bottom, left, right and top values 
const pagesLength = $('body').children().length || 0; // this variable is get how many pages we have in PDF
for (let i = 1; i < pagesLength + 1; i++) { // this line is to loop through all the pages
   let queryOfPageParagraph = `body > page:nth-child(${i})`
   let pageParagraphsLength = $(queryOfPageParagraph).children().length;
   for (let j = 1; j < pageParagraphsLength + 1; j++) { // this line is to loop through all the paragraphes
      let queryOfPageParagraphSpan = `body > page:nth-child(${i}) > p:nth-child(${j})`;
      let pageParagraphSpansLength = $(queryOfPageParagraphSpan).children().length;
      str = "";
      for (let k = 1; k < pageParagraphSpansLength + 1; k++) { // this line is to loop through all the spans
         let queryOfPageParagraphSpanElement = `body > page:nth-child(${i}) > p:nth-child(${j}) > span:nth-child(${k})`;
         let data = $(queryOfPageParagraphSpanElement)
         str = str + data.text();
         b = data.attr('b'); // bottom
         l = data.attr('l'); // left
         r = data.attr('r'); // right
         t = data.attr('t'); // top
      }
      if (str && i == 1 && b > 518 && b < 522 && t > 494 && t < 497) { // this check is to set the name of customer
         // if you see here I have usedd here bottom and top values only as left value is fixed so no need to use and right value is dynamic as per the user name characters length so no need to use right either
         setNameOfCustomer(str);
      }
      if (str && i == 1 && b > 555 && b < 700 && t > 533 && t < 668) { // this is to set the customer address, here bottom and top values includes three lines address 
         setAddressOfCustomer(str);
      }
      if (str && i == 1 && b > 1690 && b < 1693 && t > 1666 && t < 1668) { // this is to set the account number
         setAccountNumber(str);
      }
      if (str && i == 1 && b == 1110 && t == 1074) { // this is to set the date I have used here regex to extract the date from string like ( ACCOUNT DETAILS | As at 31 Aug 2018 )
         const regex = /[0-9]{2}\s[A-Z][a-z]{2}\s[0-9]{4}/gm;
         setStatementDate(regex.exec(str));
      }
      if (str && i == 2 && t > 1058 && transactionTrack) { // set the transactions
         if (l > 1864) {
            // set deposit
            checkAndSetTheTransaction("transaction_type", "DEPOSIT")
            checkAndSetTheTransaction("amount", replaceMultipleDotsToSingle(str))
            
         }
         if (l > 1458 && l < 1864) {
            // set withdrawal
            checkAndSetTheTransaction("transaction_type", "WITHDRAWAL")
            checkAndSetTheTransaction("amount", replaceMultipleDotsToSingle(str))
         }
         if (l > 482 && l < 1205) {
            // set description 
            checkAndSetTheTransaction("description", str)
            
         }
         if (l > 205 && l < 306) {
            // set date
            checkAndSetTheTransaction("date", str)
            
         }
      }
      // if(str == "Total") transactionTrack = false; // once the all the transaction list is finished I just set the variable to false
   }
}

function toMatchMultipleDots(str) { // this function is to match the amounts those have more then one dot(.) like (1.254.12)
   return str.match(/\./g).length;
}

function replaceMultipleDotsToSingle(str) { // function to replace more then one dots (it will only replace left side dot) 
   if (toMatchMultipleDots(str) > 1) {
      return str.replace('.', ',')
   } else {
      return str;
   }
}

function checkAndSetTheTransaction(type, value) { // set the transaction and push each transaction in global object
   if(value == "Total") { 
      bankStatementDetails.transactions.push(transaction)
      transactionTrack = false;
      return;
   }
   if (!transaction[type]) {
      transaction[type] = value;
   } else if (transaction[type] && type == "description") {
      transaction[type] = transaction[type] + " " + value;
   } else {
      bankStatementDetails.transactions.push(transaction)
      transaction = {};
      transaction[type] = value;
   }
}

// functions to set all the required details

function setNameOfCustomer(nameString) {
   bankStatementDetails["nameOfCustomer"] = nameString;
}

function setAddressOfCustomer(addressOfCustomerString) {
   bankStatementDetails["addressOfCustomer"] = (bankStatementDetails["addressOfCustomer"] + " " + addressOfCustomerString).trim();
}

function setAccountNumber(bankAccountNumberString) {
   bankStatementDetails["bankAccountNumber"] = bankAccountNumberString;
}

function setStatementDate(statementDateString) {
   bankStatementDetails["statementDate"] = statementDateString[0];
}

console.log(bankStatementDetails);
