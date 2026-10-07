const fs = require('fs');
let code = fs.readFileSync('src/pages/Permit.jsx', 'utf8');

// Container
code = code.replace(/max-w-5xl/g, 'max-w-4xl');
code = code.replace(/shadow-xl/g, 'shadow-lg');
code = code.replace(/px-8 pt-10 pb-8/g, 'px-6 pt-8 pb-6');
code = code.replace(/p-8 md:p-10/g, 'p-6 md:p-8');
code = code.replace(/text-xl font-bold/g, 'text-lg font-bold');

// Inputs
code = code.replace(/px-4 py-3 rounded-xl border-2/g, 'px-3 py-2.5 rounded-lg border');
code = code.replace(/px-3 py-3 rounded-xl border-2/g, 'px-3 py-2.5 rounded-lg border'); // For date inputs
code = code.replace(/font-bold text-gray-700\">(.*?)<\/label>/g, 'font-semibold text-gray-700 mb-1\">$1<\/label>');
code = code.replace(/font-bold text-gray-700 flex justify-between items-center\">(.*?)<\/label>/g, 'font-semibold text-gray-700 mb-1 flex justify-between items-center\">$1<\/label>');

// Step 3 Upload section styling
const uploadSectionOld = `{getRequiredFiles().map(fileReq => {
                                    const isOrRequired = (
                                        (fileReq.id === 'file_sim_b2' && (files['file_sio'] || formData['file_sio'])) ||
                                        (fileReq.id === 'file_sio' && (files['file_sim_b2'] || formData['file_sim_b2']))
                                    );
                                    const isStrictlyRequired = !formData.is_draft && !files[fileReq.id] && !formData[fileReq.id] && !isOrRequired;
                                    const isAssessment = fileReq.id === 'file_hasil_assessment';
                                    const hasFile = files[fileReq.id] || formData[fileReq.id];

                                    return (
                                        <div key={fileReq.id} className={\`p-5 border-2 rounded-2xl transition-all duration-300 flex flex-col gap-3 relative overflow-hidden \${hasFile ? 'border-green-200 bg-green-50/30' : 'border-gray-100 bg-white hover:border-[#E11D2E]/40 hover:shadow-md'}\`}>
                                            {hasFile && <div className="absolute top-0 right-0 w-12 h-12 bg-green-100 transform rotate-45 translate-x-6 -translate-y-6"></div>}
                                            {hasFile && <CheckCircle2 size={14} className="absolute top-2 right-2 text-green-600 z-10" />}
                                            
                                            <div className="text-sm font-bold text-gray-800">{fileReq.label} {isStrictlyRequired && !isAssessment && <span className="text-red-500">*</span>}</div>
                                            <label className={\`flex items-center justify-center w-full px-4 py-4 bg-white border-2 border-dashed rounded-xl cursor-pointer transition-colors \${hasFile ? 'border-green-300 hover:border-green-500' : 'border-gray-300 hover:border-[#E11D2E]'}\`}>
                                                <div className="flex flex-col items-center gap-2 text-sm text-gray-500 text-center">
                                                    {hasFile ? <FileText size={24} className="text-green-500 mb-1" /> : <Upload size={24} className="text-gray-400 mb-1" />}
                                                    <span className={hasFile ? 'font-semibold text-green-700' : 'font-medium text-gray-600'}>{files[fileReq.id] ? files[fileReq.id].name : (formData[fileReq.id] ? 'Dokumen Tersimpan (Ketuk ubah)' : 'Pilih / Seret File Kesini')}</span>
                                                </div>
                                                <input
                                                    type="file"
                                                    name={fileReq.id}
                                                    onChange={handleFileChange}
                                                    className="sr-only"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    required={isStrictlyRequired && !isAssessment}
                                                />
                                            </label>
                                        </div>
                                    );
                                })}`;

const uploadSectionNew = `{getRequiredFiles().map(fileReq => {
                                    const isOrRequired = (
                                        (fileReq.id === 'file_sim_b2' && (files['file_sio'] || formData['file_sio'])) ||
                                        (fileReq.id === 'file_sio' && (files['file_sim_b2'] || formData['file_sim_b2']))
                                    );
                                    const isStrictlyRequired = !formData.is_draft && !files[fileReq.id] && !formData[fileReq.id] && !isOrRequired;
                                    const isAssessment = fileReq.id === 'file_hasil_assessment';
                                    const hasFile = files[fileReq.id] || formData[fileReq.id];

                                    return (
                                        <div key={fileReq.id} className={\`p-4 border rounded-xl transition-all duration-300 flex items-center justify-between gap-4 \${hasFile ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white hover:border-[#E11D2E]/40'}\`}>
                                            <div className="flex items-center gap-3">
                                                <div className={\`p-2.5 rounded-lg \${hasFile ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}\`}>
                                                    {hasFile ? <CheckCircle2 size={20} /> : <FileText size={20} />}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-800">{fileReq.label} {isStrictlyRequired && !isAssessment && <span className="text-red-500">*</span>}</div>
                                                    <div className="text-xs text-gray-500">{files[fileReq.id] ? files[fileReq.id].name : (formData[fileReq.id] ? 'Tersimpan' : 'PDF/JPG, Maks 5MB')}</div>
                                                </div>
                                            </div>
                                            <label className={\`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors text-sm font-medium \${hasFile ? 'bg-white border border-green-200 text-green-700 hover:bg-green-50' : 'bg-[#E11D2E]/10 text-[#E11D2E] hover:bg-[#E11D2E]/20'}\`}>
                                                <Upload size={16} />
                                                {hasFile ? 'Ubah File' : 'Unggah'}
                                                <input
                                                    type="file"
                                                    name={fileReq.id}
                                                    onChange={handleFileChange}
                                                    className="sr-only"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    required={isStrictlyRequired && !isAssessment}
                                                />
                                            </label>
                                        </div>
                                    );
                                })}`;

if(code.includes(uploadSectionOld)) {
    code = code.replace(uploadSectionOld, uploadSectionNew);
} else {
    console.log('Upload section not found! Need to manually check.');
}

// Ensure "mb-1" didn't mess up non-label stuff or double apply
code = code.replace(/mb-1 mb-1/g, 'mb-1');

// Change step buttons to be slightly smaller
code = code.replace(/px-6 py-3.5/g, 'px-5 py-2.5');

fs.writeFileSync('src/pages/Permit.jsx', code);
console.log('Permit.jsx updated successfully.');
