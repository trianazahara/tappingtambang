const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

// 1. Frontend Admin
walkDir('d:/tapping tambang/frontend-admin/src', (filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        const regex1 = /'http:\/\/localhost:3000([^']*)'/g;
        if (regex1.test(content)) {
            content = content.replace(regex1, '`${import.meta.env.VITE_API_URL}$1`');
            modified = true;
        }

        const regex2 = /"http:\/\/localhost:3000([^"]*)"/g;
        if (regex2.test(content)) {
            content = content.replace(regex2, '`${import.meta.env.VITE_API_URL}$1`');
            modified = true;
        }

        const regex3 = /`http:\/\/localhost:3000([^`]*)`/g;
        if (regex3.test(content)) {
            content = content.replace(regex3, '`${import.meta.env.VITE_API_URL}$1`');
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Modified (Frontend):', filePath);
        }
    }
});

// 2. Mobile Satpam
walkDir('d:/tapping tambang/mobile-satpam/src', (filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        const regex1 = /['"`]http:\/\/[0-9\.]+:\d+([^'"`]*)['"`]/g;
        if (regex1.test(content)) {
            content = content.replace(regex1, '`${process.env.EXPO_PUBLIC_API_URL}$1`');
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Modified (Mobile):', filePath);
        }
    }
});

console.log('Selesai mereplace URL!');
