const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
var formidable = require('formidable');
const path = require('path');
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, '..', 'data', 'database', 'tricell_intranet.db');
const db = new Database(dbPath);
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

router.use(express.static('./public'));



// --------------------- Läs in Masterframen --------------------------------
const readHTML = require('../readHTML.js');
const fs = require('fs');

var htmlHead = readHTML('./masterframe/head.html');
var htmlHeader = readHTML('./masterframe/header.html');
var htmlMenu = readHTML('./masterframe/menu.html');
var htmlInfoStart = readHTML('./masterframe/infoStart.html');
var htmlInfoStop = readHTML('./masterframe/infoStop.html');
var htmlFooter = readHTML('./masterframe/footer.html');
var htmlBottom = readHTML('./masterframe/bottom.html');

var htmlLoggedinMenuCSS = readHTML('./masterframe/loggedinmenu_css.html');
var htmlLoggedinMenuJS = readHTML('./masterframe/loggedinmenu_js.html');
var htmlLoggedinMenu = readHTML('./masterframe/loggedinmenu.html');
var htmlVirusimagesCSS = readHTML('./masterframe/virusimages_css.html');

function getVirusImagesHTML(virusId) {
    let html = '';

    // Lightbox modal (Här fick vi lite hjälp av AI)
    html += `
        <div id="image-lightbox" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; justify-content:center; align-items:center; cursor:pointer;" onclick="this.style.display='none';">
            <span style="position:absolute; top:20px; right:30px; color:#fff; font-size:36px; font-weight:bold; cursor:pointer; z-index:10000; line-height:1;" onclick="event.stopPropagation(); document.getElementById('image-lightbox').style.display='none';">&#x2715;</span>
            <img id="lightbox-img" src="" alt="Enlarged" style="max-width:90%; max-height:90%; object-fit:contain; border:2px solid #fff; cursor:default;" onclick="event.stopPropagation();">
        </div>
    `;

    html += '<div class="virusimages-section" style="margin-top:30px;">';

    // Header med titel och upload-knapp
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">';
    html += '<h3 style="margin:0;">Research images:</h3>';
    html += `Upload New Image <a id="upload-new-image-btn" onclick="document.getElementById('virusimage-input').click();" class="virusimages-upload-btn">+</a>`;

    //Skaffa en form för att ladda upp bilder
    html += `
        <form id="upload-image-form" action="http://localhost:3000/api/editvirusimage/newvirusimage/${virusId}" method="POST" enctype="multipart/form-data" style="display:none;">
            <input type="file" name="virusimage" id="virusimage-input" accept="image/jpeg" onchange="this.form.submit()">
        </form>
    `;

    html += '</div>';

    // Gallery grid
    html += '<div class="virusimages-gallery" style="display:grid; grid-template-columns: repeat(5, 1fr); gap:15px;">';

    const imageDir = `./public/virusphoto/${virusId}`;
    if (fs.existsSync(imageDir)) {
        const files = fs.readdirSync(imageDir).filter(file => file.endsWith('.jpg')).sort((a, b) => {
            const numA = parseInt(a.replace('.jpg', ''));
            const numB = parseInt(b.replace('.jpg', ''));
            return numA - numB;
        });

        files.forEach(file => {
            const imageNumber = file.replace('.jpg', '');
            html += `
                <div class="image-item" style="position:relative; text-align:center;">
                    <img src="virusphoto/${virusId}/${file}"
                         alt="Virus ${virusId} Image ${imageNumber}"
                         style="width:100%; height:120px; object-fit:cover; border:1px solid #ddd; cursor:pointer;"
                         onclick="event.stopPropagation(); var lb = document.getElementById('image-lightbox'); document.getElementById('lightbox-img').src=this.src; lb.style.display='flex';">
                    <a class="delete-image-btn" href="http://localhost:3000/api/editvirusimage/deletevirusimage/${virusId}/${imageNumber}">
                        &#x2715;
                    </a>
                </div>
            `;
        });
    }

    // Info text
    //html += '<p style="margin-top:15px; font-size:12px; color:#666;">Bilderna presenteras som miniatyrer. Ni behöver inte generera thumbnails</p>';

    html += '</div>';

    return html;
}


router.get('/deletevirusimage/:virusId/:imageNumber', function(request, response) {
    let virusId = request.params.virusId;
    let imageNumber = request.params.imageNumber;
    
    async function deleteImage() {
        response.setHeader('Content-type','text/html');
        response.write(htmlHead);
        if(request.session.userId)
        {
            response.write(htmlLoggedinMenuCSS);
            response.write(htmlLoggedinMenuJS);
            response.write(htmlLoggedinMenu);
           
        }
        response.write(htmlHeader);
        response.write(htmlMenu);
        response.write(htmlInfoStart);

        if(request.session.userId && (request.session.securityAccessLevel == "B" || request.session.securityAccessLevel == "A")) {
            //Radera bilden
            let imagePath = `./public/virusphoto/${virusId}/${imageNumber}.jpg`;
            if(fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);

                //Omnumrera återstående bilder för att fylla glappet
                const virusImageDir = `./public/virusphoto/${virusId}`;
                if (fs.existsSync(virusImageDir)) {
                    const files = fs.readdirSync(virusImageDir).filter(file => file.endsWith('.jpg')).sort((a, b) => {
                        const numA = parseInt(a.replace('.jpg', ''));
                        const numB = parseInt(b.replace('.jpg', ''));
                        return numA - numB;
                    });

                    files.forEach((file, index) => {
                        const oldPath = path.join(virusImageDir, file);
                        const newfileName = `${index + 1}.jpg`;
                        const newPath = path.join(virusImageDir, newfileName);
                        if (oldPath !== newPath) {
                            fs.renameSync(oldPath, newPath);
                        }
                    });
                }
            }
            else{
                response.write(`<p style="font-size:18px; color:red;">Image not found</p>`);
            }
        }
        else { 
            response.write('<p style="font-size:18px; color:red;">Unauthorized</p>'); 
        }
        response.write(`<p style="font-size:18px; color:green;">Image deleted successfully</p>`);
        response.write(`<a href="http://localhost:3000/api/virusdatabase/${virusId}" style="display:inline-block; margin-top:20px; padding:10px 20px; background-color:#007BFF; color:#fff; text-decoration:none; border-radius:5px;">Back to Edit Virus</a>`);
        response.write(htmlInfoStop);
        response.write(htmlFooter);
        response.write(htmlBottom);
        response.end();
    }
    deleteImage();
});

router.post('/newvirusimage/:id', function(request, response) {
    
    let virusId = request.params.id;

    if(request.session.userId && (request.session.securityAccessLevel == "B" || request.session.securityAccessLevel == "A")) {
        var form = new formidable.IncomingForm();
        form.parse(request, function(err, fields, files) {
            async function handleFile() {
                response.setHeader('Content-type','text/html');
                response.write(htmlHead);
                if(request.session.userId)
                {
                    response.write(htmlLoggedinMenuCSS);
                    response.write(htmlLoggedinMenuJS);
                    response.write(htmlLoggedinMenu);
                }
                response.write(htmlHeader);
                response.write(htmlMenu);
                response.write(htmlVirusimagesCSS);
                response.write(htmlInfoStart);

                //Kolla om mappen för viruset finns, annars skapa den
                let virusImageDir = `./public/virusphoto/${virusId}`;
                if (!fs.existsSync(virusImageDir)) {
                    fs.mkdirSync(virusImageDir, { recursive: true });
                }


                //Räkna antal bilder som finns för viruset
                let imageNumber = 0;
                while(fs.existsSync(`./public/virusphoto/${virusId}/${imageNumber + 1}.jpg`)) {
                    imageNumber++;
                }

                //Ladda upp bilden
                var ffile = Array.isArray(files.virusimage) ? files.virusimage[0] : files.virusimage;
                if(ffile && ffile.originalFilename != "") {
                    var oldpath = ffile.filepath;
                    var newpath = path.resolve(__dirname, "../public/virusphoto/" + virusId + "/" + (imageNumber + 1) + ".jpg");
                    try{
                        fs.renameSync(oldpath, newpath);
                    } catch(e) {
                        fs.copyFileSync(oldpath, newpath);
                        fs.unlinkSync(oldpath);
                    }                    
                }
                //Ge respons till användaren
                response.write(`<p style="font-size:18px; color:green;">Image uploaded successfully</p>`);
                response.write(`<a href="http://localhost:3000/api/virusdatabase/${virusId}" style="display:inline-block; margin-top:20px; padding:10px 20px; background-color:#007BFF; color:#fff; text-decoration:none; border-radius:5px;">Back to Edit Virus</a>`);

                response.write(htmlInfoStop);
                response.write(htmlFooter);
                response.write(htmlBottom);
                response.end();
            }
            handleFile();
        });
    }
    else {
        response.writeHead(401, {'Content-Type': 'text/html'});
        response.write(htmlHead);
        response.write(htmlHeader);
        response.write(htmlMenu);
        response.write(htmlInfoStart);
        response.write('<h1>Unauthorized</h1><p>You must be logged in with appropriate permissions to upload images.</p>');
        response.write(htmlInfoStop);
        response.write(htmlFooter);
        response.write(htmlBottom);
        response.end();
    }
});

module.exports = router;