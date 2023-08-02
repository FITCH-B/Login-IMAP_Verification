const puppeteer = require('puppeteer');
const Imap = require('node-imap');
const simpleParser = require('mailparser').simpleParser;

//Lines #6-7 Only needed when buy function is being used
//const readline = require('readline-sync');
//let dropPage = readline.question('Input drop page: ')

// Connect to the IMAP server
const imap = new Imap({
  user: '[YOUR EMAIL]', //I used gmail, if you use a different provider you need to change host domain on line 13
  password: '[YOUR PASSWORD]',
  host: 'imap.gmail.com',
  port: 993,
  tls: true
});

let page;

async function login() {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('https://www.niftygateway.com/new-login/');

    await page.setViewport({ width: 1000, height: 1000 });
    const x = 100;
    const y = 200;
    
    await page.type('#email', '[YOUR NIFTY ACCOUNT EMAIL]');
    await page.mouse.move(x, y);
    await page.waitForTimeout(1500);
    await page.type('#password', '[YOUR NIFTY ACCOUNT PASSWORD]');
    await page.mouse.move(x, y);
    await page.waitForTimeout(1500);
    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');
    
    console.log('Getting verification code...');
    
    return page;   
    
  } catch (error) {
    console.log('Login failed:', error);
  }; 
};

async function getEmailVerificationCode() {
    return new Promise((resolve, reject) => {
      // When the connection is established, search for the verification code email
      imap.once('ready', () => {
        // Keep searching for new emails until one matching the search parameters is found
        const intervalId = setInterval(() => {
          imap.openBox('INBOX', true, (err, box) => {
            if (err) {
              clearInterval(intervalId);
              reject(err);
              return;
            };
  
            imap.search(['UNSEEN', ['SUBJECT', 'Verify']], (err, results) => {
              if (err) {
                clearInterval(intervalId);
                reject(err);
                return;
              } ; 
              if (results.length > 0) {
                // Get the latest email containing a verification code
                const latestEmail = results.pop();  
                // Fetch the email's body
                const f = imap.fetch(latestEmail, { bodies: '' });
                f.on('message', (msg, seqno) => {
                  msg.on('body', (stream, info) => {
                    let buffer = '';
  
                    stream.on('data', (chunk) => {
                      buffer += chunk.toString('utf8');
                    });
  
                    // Parse the email using the "mailparser" package
                    stream.once('end', () => {
                      simpleParser(buffer, (err, mail) => {
                        if (err) {
                          clearInterval(intervalId);
                          reject(err);
                          return;
                        }  
                        // Extract the verification code from the email body using a regular expression
                        const verificationCode = /\b\d{6}\b/.exec(mail.text);
                        const latestVerificationCode = verificationCode[0];
                        // Use the verification code in your application logic
                        clearInterval(intervalId);
                        resolve(latestVerificationCode);
                      });
                    });
                  });
                });
                f.once('error', (err) => {
                  clearInterval(intervalId);
                  reject(err);
                });
                f.once('end', () => {
                  imap.end();
                });
              }
            });
          });
        }, 5000); // Check for new emails every 5 seconds
      });
  
      setTimeout(() => {
        imap.connect();
      }, 3000);
    });
  };
  
async function run() {
    try {
        page = await login();
        const x = 100;
        const y = 200;
        const verificationCode = await getEmailVerificationCode();
        console.log(`Verification code: ${verificationCode}`);
        await page.mouse.move(x, y);
        await page.type('#code', verificationCode);
        await page.waitForTimeout(1500);
        await page.mouse.move(x, y);
        await page.click('button[type="submit"]'); 
        console.log('Signed In');
    } catch (error) {
        console.log('Error:', error);
    };
};

run(); //Temporary to show log-in/IMAP procedure


//Currently depricated I believe, will need to test next FCFS drop
/*async function buy() {    
    await run();
    const x = 100;
    const y = 200;
    setTimeout(async () => {
        await page.goto(`${dropPage}`);
        await page.waitForSelector('button[data-testid="component-button"]');
        await page.mouse.move(x, y); 
        await page.click('button[data-testid="component-button"]');
        await page.waitForTimeout(2000);
        await page.mouse.move(x, y);
        await page.waitForSelector('button.cta-button');
        await page.waitForTimeout(1000);
        await page.mouse.move(x, y);        
        await page.click('button.cta-button');
        await page.waitForTimeout(1500);
        await page.mouse.move(x, y);
        await page.waitForSelector('iframe[src^="https://www.google.com/recaptcha"]');
        // Get the reCaptcha iframe element handle
        const recaptchaFrame = await page.$('iframe[src^="https://www.google.com/recaptcha"]');
        // Switch to the reCaptcha iframe context
        const recaptchaFrameContext = await recaptchaFrame.contentFrame();
        await recaptchaFrameContext.waitForSelector('span.rc-anchor-checkbox');
        // Click the reCaptcha checkbox
        let checkboxClicked = false;
        while (!checkboxClicked) {
            const checkbox = await recaptchaFrameContext.$('span.rc-anchor-checkbox');
            if (checkbox) {
                await checkbox.click();
                checkboxClicked = true;
            } else {
                
            };
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 1 second before checking again
            //await page.waitForTimeout(5000);            
        };     
    }, 5000);
}


//Need to finish the checkout function after more testing
async function checkOut() {
    await buy();
    

    //console.log('\x1b[92m','Successful Order!','\x1b[0m');
}

checkOut();
//console.log('\x1b[92m','Successful Order!','\x1b[0m')
*/

