const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');

const fs = require('fs');
const zip = new PizZip(fs.readFileSync('uploads/templates/hijau.docx', 'binary'));

const imageOpts = {
    centered: false,
    getImage: (tv, tn) => {
        if (!tv) return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=','base64');
        return Buffer.from(tv, 'base64');
    },
    getSize: () => [100, 100]
};

const imageModule = new ImageModule(imageOpts);
const doc = new Docxtemplater(zip, { modules: [imageModule] });

const fotoBuffer = fs.readFileSync('uploads/file_foto-1789633428073-974307519.png');
try {
    doc.render({ foto: fotoBuffer.toString('base64') });
    console.log('BASE64 OK');
} catch (e) {
    console.error(e.stack);
}
