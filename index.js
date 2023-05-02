const express = require("express");
const cors = require("cors");
const app = express();
const port = 5000;
// ******************************
// ******************************

//import greenlock
var Greenlock = require("greenlock");
//green lock create instance
var greenlock = Greenlock.create({
  configDir: "./greenlock",

  packageAgent: "app",

  packageRoot: __dirname + "/./",

  maintainerEmail: "mali1995ror@gmail.com",

  staging: true,
  directoryUrl: "https://acme-staging-v02.api.letsencrypt.org/directory",
  notify: function (event, details) {
    if ("error" === event) {
      // `details` is an error object in this case
      console.log("details", details);
    }
  },
});
//greenlock defaults
greenlock.manager.defaults({
  agreeToTerms: true,

  subscriberEmail: "mali1995ror@gmail.com",

  challenges: {
    "http-01": {
      module: "acme-http-01-webroot",
      webroot: "/tmp/.well-known/acme-challenge",
    },
  },
});
// ******************************
// ******************************

// proxy server for redirects to other servers
var proxy = require("http-proxy").createProxyServer({
  host: "http://servername.com",
  // port: 80
});
app.use("/servername", function (req, res, next) {
  proxy.web(
    req,
    res,
    {
      target: "http://servername.com",
    },
    next
  );
});
// ******************************
//middleware
app.use(express.json());
app.use(cors());
//routes
app.get("/", (req, res) => {
  res.send("Welcome to green World!");
});
//get ssl domain certificate from greenlock
app.post("/", async (req, res) => {
  try {
    let domains = req.body.domains;
    let results = await getSSLForDomains(domains);
    console.log(results, "results");
    if (results.length > 0) {
      return res.json({ success: true });
    } else {
      return res.json({ success: false });
    }
  } catch (error) {
    res.json({ message: error.message, success: false });
  }
});
//get green lock ssl
app.get("/:servername", (req, res) => {
  let servername = req.params.servername;
  getGreenLockSSL(servername)
    .then(function (pems) {
      if (pems && pems.privkey && pems.cert && pems.chain) {
        console.info("Success");
      }
      res.json({ pems });
      console.log(pems, "pems");
    })
    .catch(function (e) {
      console.log("Big bad error:", e.code);
      res.json({ e });
      // console.error(e);
    });
});
// ****************
//get ssl for domains
async function getSSLForDomains(domains) {
  var results = [];

  for (let domain of domains) {
    let names = [domain, "www." + domain];
    console.log(names, "names");
    try {
      results.push(
        await greenlock.add({
          subject: names[0],
          altnames: names,
        })
      );
    } catch (err) {
      console.error("error adding domains", err);
    }
  }

  return results;
}
getSSLForDomains(["hrm.viralsquare.org"]);
//check if ssl exists for site
async function getGreenLockSSL(servername) {
  return await greenlock.get({ servername: `${servername}` });
}

//server listen
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
