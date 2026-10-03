const { jsPDF } = window.jspdf;

const canvas = document.getElementById('certCanvas');
const ctx = canvas.getContext('2d');

// Font Library Array
const fontLibrary = [
  "Cinzel Decorative", "Playfair Display", "Montserrat", "Poppins", "Great Vibes",
  "Alex Brush", "Dancing Script", "Pacifico", "Parisienne", "Pinyon Script",
  "Sacramento", "Satisfy", "Tangerine", "Allura", "Italianno", "Cormorant Garamond",
  "Lora", "Merriweather", "PT Serif", "Marcellus", "Bodoni Moda", "EB Garamond",
  "Inter", "Roboto", "Open Sans", "Lato", "Oswald", "Raleway", "Caveat",
  "Abril Fatface", "Bebas Neue", "Montez", "Niconne", "Rochester",
  "League Spartan", "DM Serif Display", "Arial", "Georgia", "Times New Roman"
];

// Elements Registry
let elements = {
  title: { text: "CERTIFICATE OF ACHIEVEMENT", x: 500, y: 120, font: "Cinzel Decorative", size: 36, color: "#800020", case: "upper" },
  lead: { text: "THIS IS PROUDLY PRESENTED TO", x: 500, y: 190, font: "Poppins", size: 15, color: "#333333", case: "upper" },
  name: { text: "M. S. Dhoni", x: 500, y: 270, font: "Great Vibes", size: 62, color: "#111111", case: "original" },
  subtitle: { text: "for outstanding performance, leadership, and dedicated service.", x: 500, y: 350, font: "Lora", size: 18, color: "#3c4043", case: "original" },

  // Logo Overlay
  logo: { img: null, x: 450, y: 35, w: 100, h: 60 }
};

// Array supporting up to 4 dynamic authorities
let authorities = [
  { id: 1, name: "Dr. Robert Vance", desig: "Director of Education", sigImg: null, sigX: 280, sigY: 460, w: 120, h: 50, textX: 280, nameY: 530, desigY: 555 },
  { id: 2, name: "Elena Rostova", desig: "Head of Operations", sigImg: null, sigX: 720, sigY: 460, w: 120, h: 50, textX: 720, nameY: 530, desigY: 555 }
];

let authNameStyle = { font: "Montserrat", size: 16, color: "#202124", case: "original" };
let authDesigStyle = { font: "Inter", size: 13, color: "#5f6368", case: "original" };

let customTemplateImg = null;
let currentTemplateIndex = 0;
let currentBorderStyle = 'burgundy_gold';
let recipientList = ["M. S. Dhoni", "Cristiano Ronaldo", "Lewis Hamilton"];
let selectedElementKey = null;
let selectedAuthIndex = null;
let selectedAuthType = null;
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let hasMoved = false;
let showGrid = false;
let activeInlineInput = null;

const presetThemes = [
  { name: "Burgundy & Gold Elegance", primary: "#800020", secondary: "#D4AF37", bg: "#FFFFFF" },
  { name: "Modern Deep Navy Wave", primary: "#0A192F", secondary: "#E6C687", bg: "#F8FAFC" },
  { name: "Classic Engraved Blue", primary: "#1E3A8A", secondary: "#3B82F6", bg: "#FFFFFF" },
  { name: "Gold Ribbon Curved", primary: "#B45309", secondary: "#F59E0B", bg: "#FFFDFA" },
  { name: "Minimalist Slate", primary: "#18181B", secondary: "#71717A", bg: "#FFFFFF" }
];

function getFormattedText(text, textCase) {
  if (!text) return "";
  if (textCase === 'upper') return text.toUpperCase();
  if (textCase === 'lower') return text.toLowerCase();
  if (textCase === 'title') return text.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return text;
}

function drawBorderPattern(style, primary, secondary) {
  ctx.save();
  if (style === 'burgundy_gold') {
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(260, 0); ctx.bezierCurveTo(180, 150, 50, 180, 0, 320);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(280, 0); ctx.bezierCurveTo(200, 160, 60, 190, 0, 340);
    ctx.lineTo(0, 320); ctx.bezierCurveTo(50, 180, 180, 150, 260, 0);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.moveTo(canvas.width, canvas.height); ctx.lineTo(canvas.width - 260, canvas.height);
    ctx.bezierCurveTo(canvas.width - 180, canvas.height - 150, canvas.width - 50, canvas.height - 180, canvas.width, canvas.height - 320);
    ctx.closePath(); ctx.fill();

    ctx.strokeStyle = secondary;
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

  } else if (style === 'navy_modern') {
    ctx.fillStyle = primary;
    ctx.fillRect(0, 0, canvas.width, 110);
    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.moveTo(0, 110);
    ctx.quadraticCurveTo(canvas.width / 2, 170, canvas.width, 110);
    ctx.lineTo(canvas.width, 125);
    ctx.quadraticCurveTo(canvas.width / 2, 185, 0, 125);
    ctx.fill();

  } else if (style === 'classic_ornate') {
    ctx.strokeStyle = primary;
    ctx.lineWidth = 8;
    ctx.strokeRect(35, 35, canvas.width - 70, canvas.height - 70);
    ctx.strokeStyle = secondary;
    ctx.lineWidth = 3;
    ctx.strokeRect(45, 45, canvas.width - 90, canvas.height - 90);

  } else if (style === 'minimal') {
    ctx.strokeStyle = primary;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(30, 80); ctx.lineTo(30, 30); ctx.lineTo(80, 30);
    ctx.moveTo(canvas.width - 80, 30); ctx.lineTo(canvas.width - 30, 30); ctx.lineTo(canvas.width - 30, 80);
    ctx.moveTo(30, canvas.height - 80); ctx.lineTo(30, canvas.height - 30); ctx.lineTo(80, canvas.height - 30);
    ctx.moveTo(canvas.width - 80, canvas.height - 30); ctx.lineTo(canvas.width - 30, canvas.height - 30); ctx.lineTo(canvas.width - 30, canvas.height - 80);
    ctx.stroke();

  } else if (style === 'ribbon') {
    ctx.fillStyle = primary;
    ctx.fillRect(0, 0, 20, canvas.height);
    ctx.fillStyle = secondary;
    ctx.fillRect(25, 0, 8, canvas.height);
  }
  ctx.restore();
}

function render() {
  canvas.width = 1000;
  canvas.height = 700;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const theme = presetThemes[currentTemplateIndex] || presetThemes[0];

  if (customTemplateImg) {
    ctx.drawImage(customTemplateImg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawBorderPattern(currentBorderStyle, theme.primary, theme.secondary);
  }

  if (showGrid) {
    ctx.strokeStyle = 'rgba(234, 67, 53, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }

  // Draw Logo
  if (elements.logo && elements.logo.img) {
    ctx.drawImage(elements.logo.img, elements.logo.x, elements.logo.y, elements.logo.w, elements.logo.h);
  }

  // Draw Main Text Elements
  ['title', 'lead', 'name', 'subtitle'].forEach(key => {
    const item = elements[key];
    if (item && item.text) {
      ctx.font = `${item.size}px "${item.font}"`;
      ctx.fillStyle = item.color;
      ctx.textAlign = 'center';

      if (item.text.length > 75) {
        const words = getFormattedText(item.text, item.case).split(' ');
        let line = '';
        let lineY = item.y;
        for (let n = 0; n < words.length; n++) {
          let testLine = line + words[n] + ' ';
          if (ctx.measureText(testLine).width > 680 && n > 0) {
            ctx.fillText(line, item.x, lineY);
            line = words[n] + ' ';
            lineY += item.size + 6;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, item.x, lineY);
      } else {
        ctx.fillText(getFormattedText(item.text, item.case), item.x, item.y);
      }
    }
  });

  // Render Authorities
  authorities.forEach((auth) => {
    if (auth.sigImg) {
      ctx.drawImage(auth.sigImg, auth.sigX - (auth.w / 2), auth.sigY, auth.w, auth.h);
    }
    // Name
    ctx.font = `${authNameStyle.size}px "${authNameStyle.font}"`;
    ctx.fillStyle = authNameStyle.color;
    ctx.textAlign = 'center';
    ctx.fillText(getFormattedText(auth.name, authNameStyle.case), auth.textX, auth.nameY);

    // Designation
    ctx.font = `${authDesigStyle.size}px "${authDesigStyle.font}"`;
    ctx.fillStyle = authDesigStyle.color;
    ctx.fillText(getFormattedText(auth.desig, authDesigStyle.case), auth.textX, auth.desigY);
  });
}

function removeInlineInput() {
  if (activeInlineInput) {
    activeInlineInput.remove();
    activeInlineInput = null;
  }
}

// Single-Click Live Canvas Text Editor
function openInlineEditor(targetObj, textProp) {
  removeInlineInput();
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / canvas.width;
  const scaleY = rect.height / canvas.height;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = targetObj[textProp];

  input.style.position = 'absolute';
  input.style.left = `${rect.left + window.scrollX + (targetObj.x || targetObj.textX - 200) * scaleX}px`;
  input.style.top = `${rect.top + window.scrollY + ((targetObj.y || targetObj.nameY || targetObj.desigY) - 22) * scaleY}px`;
  input.style.width = `${400 * scaleX}px`;
  input.style.fontSize = `16px`;
  input.style.textAlign = 'center';
  input.style.background = '#ffffff';
  input.style.border = '2px solid #4285f4';
  input.style.borderRadius = '4px';
  input.style.outline = 'none';
  input.style.zIndex = '1000';

  document.body.appendChild(input);
  input.focus();
  input.select();
  activeInlineInput = input;

  const saveChange = () => {
    if (input.value.trim() !== '') {
      targetObj[textProp] = input.value;
      render();
    }
    removeInlineInput();
  };

  input.addEventListener('blur', saveChange);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveChange();
    if (e.key === 'Escape') removeInlineInput();
  });
}

// Initialize Typography Dropdowns
const fontFamilySelect = document.getElementById('fontFamilySelect');
fontLibrary.forEach(font => {
  const opt = document.createElement('option');
  opt.value = font;
  opt.textContent = font;
  fontFamilySelect.appendChild(opt);
});

function syncFontStudioUI() {
  const targetKey = document.getElementById('targetSectionSelect').value;
  let styleObj = elements[targetKey] || (targetKey === 'authName' ? authNameStyle : authDesigStyle);

  fontFamilySelect.value = styleObj.font;
  document.getElementById('fontSizeInput').value = styleObj.size;
  document.getElementById('textColorInput').value = styleObj.color;

  document.querySelectorAll('#modal-fonts .btn-group .glass-btn').forEach(b => b.classList.remove('active'));
  if (styleObj.case === 'original') document.getElementById('caseOriginal').classList.add('active');
  if (styleObj.case === 'lower') document.getElementById('caseLower').classList.add('active');
  if (styleObj.case === 'upper') document.getElementById('caseUpper').classList.add('active');
  if (styleObj.case === 'title') document.getElementById('caseTitle').classList.add('active');
}

document.getElementById('targetSectionSelect').addEventListener('change', syncFontStudioUI);

document.getElementById('applyTypographyBtn').addEventListener('click', () => {
  const targetKey = document.getElementById('targetSectionSelect').value;
  const fFont = fontFamilySelect.value;
  const fSize = parseFloat(document.getElementById('fontSizeInput').value) || 16;
  const fColor = document.getElementById('textColorInput').value;

  if (targetKey === 'authName') {
    authNameStyle.font = fFont; authNameStyle.size = fSize; authNameStyle.color = fColor;
  } else if (targetKey === 'authDesig') {
    authDesigStyle.font = fFont; authDesigStyle.size = fSize; authDesigStyle.color = fColor;
  } else {
    elements[targetKey].font = fFont;
    elements[targetKey].size = fSize;
    elements[targetKey].color = fColor;
  }
  render();
});

['caseOriginal', 'caseLower', 'caseUpper', 'caseTitle'].forEach(id => {
  document.getElementById(id).addEventListener('click', () => {
    const targetKey = document.getElementById('targetSectionSelect').value;
    const c = id.replace('case', '').toLowerCase();
    if (targetKey === 'authName') authNameStyle.case = c;
    else if (targetKey === 'authDesig') authDesigStyle.case = c;
    else elements[targetKey].case = c;
    syncFontStudioUI();
  });
});

// Canvas Interaction (Drag & Click)
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);

  dragStartX = e.clientX;
  dragStartY = e.clientY;
  hasMoved = false;
  selectedElementKey = null;
  selectedAuthIndex = null;
  selectedAuthType = null;

  // Check main elements
  Object.keys(elements).forEach(key => {
    const item = elements[key];
    if (item.text && Math.abs(mx - item.x) < 220 && Math.abs(my - item.y) < 25) {
      selectedElementKey = key;
    } else if (item.img && mx >= item.x && mx <= item.x + item.w && my >= item.y && my <= item.y + item.h) {
      selectedElementKey = key;
    }
  });

  // Check Authorities
  if (!selectedElementKey) {
    authorities.forEach((auth, idx) => {
      if (Math.abs(mx - auth.textX) < 150) {
        if (Math.abs(my - auth.nameY) < 18) { selectedAuthIndex = idx; selectedAuthType = 'name'; }
        else if (Math.abs(my - auth.desigY) < 18) { selectedAuthIndex = idx; selectedAuthType = 'desig'; }
        else if (auth.sigImg && Math.abs(my - (auth.sigY + auth.h / 2)) < 30) { selectedAuthIndex = idx; selectedAuthType = 'sig'; }
      }
    });
  }

  if (selectedElementKey || selectedAuthIndex !== null) isDragging = true;
  else removeInlineInput();
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const dist = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);
  if (dist > 5) {
    hasMoved = true;
    removeInlineInput();
  }

  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);

  if (selectedElementKey) {
    elements[selectedElementKey].x = mx;
    elements[selectedElementKey].y = my;
  } else if (selectedAuthIndex !== null) {
    const auth = authorities[selectedAuthIndex];
    if (selectedAuthType === 'sig') {
      auth.sigX = mx; auth.sigY = my - (auth.h / 2);
    } else {
      auth.textX = mx;
      if (selectedAuthType === 'name') { auth.nameY = my; auth.desigY = my + 25; }
      else { auth.desigY = my; }
    }
  }
  render();
});

window.addEventListener('mouseup', () => {
  if (!hasMoved) {
    if (selectedElementKey && elements[selectedElementKey].text) {
      openInlineEditor(elements[selectedElementKey], 'text');
    } else if (selectedAuthIndex !== null && selectedAuthType !== 'sig') {
      openInlineEditor(authorities[selectedAuthIndex], selectedAuthType);
    }
  }
  isDragging = false;
});

// Personal Setup Handler
document.getElementById('applyPersonalBtn').addEventListener('click', () => {
  elements.name.text = document.getElementById('personalNameInput').value;
  elements.title.text = document.getElementById('personalTitleInput').value;
  elements.lead.text = document.getElementById('personalLeadInput').value;
  elements.subtitle.text = document.getElementById('personalSubtitleInput').value;

  if (!recipientList.includes(elements.name.text)) {
    recipientList.unshift(elements.name.text);
    updateRecipientDropdown();
  }
  render();
});

// Recipient Dropdown Sync
const previewSelect = document.getElementById('previewSelect');
function updateRecipientDropdown() {
  previewSelect.innerHTML = '';
  recipientList.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r; opt.textContent = r;
    previewSelect.appendChild(opt);
  });
}
previewSelect.addEventListener('change', (e) => {
  elements.name.text = e.target.value;
  document.getElementById('personalNameInput').value = e.target.value;
  render();
});

// Custom Template & Background Management
document.getElementById('uploadTemplateBtn').addEventListener('click', () => {
  const fileInput = document.getElementById('templateInput');
  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      customTemplateImg = new Image();
      customTemplateImg.onload = () => render();
      customTemplateImg.src = ev.target.result;
    };
    reader.readAsDataURL(fileInput.files[0]);
  }
});

function clearTemplate() {
  customTemplateImg = null;
  document.getElementById('templateInput').value = '';
  render();
}

document.getElementById('clearTemplateBtn').addEventListener('click', clearTemplate);
document.getElementById('removePresetBgBtn').addEventListener('click', clearTemplate);

// CSV Enterprise Engine Fix
document.getElementById('loadCsvBtn').addEventListener('click', () => {
  const file = document.getElementById('csvInput').files[0];
  if (file) {
    Papa.parse(file, {
      complete: (results) => {
        recipientList = results.data.map(r => Array.isArray(r) ? r[0] : (r.Name || r.name)).filter(n => n && n.trim() !== '');
        if (recipientList.length > 0) {
          updateRecipientDropdown();
          elements.name.text = recipientList[0];
          document.getElementById('personalNameInput').value = recipientList[0];
          render();
          alert(`Successfully imported ${recipientList.length} recipient names!`);
        }
      }
    });
  } else {
    alert("Please choose a valid .csv file first.");
  }
});

// Logo Overlay Manager
document.getElementById('applyLogoBtn').addEventListener('click', () => {
  const fileInput = document.getElementById('logoInput');
  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      elements.logo.img = new Image();
      elements.logo.img.onload = () => render();
      elements.logo.img.src = ev.target.result;
    };
    reader.readAsDataURL(fileInput.files[0]);
  }
  elements.logo.w = parseFloat(document.getElementById('logoWidthInput').value) || 100;
  elements.logo.h = parseFloat(document.getElementById('logoHeightInput').value) || 60;
  render();
});

// Dynamic Authorities Engine (Up to 4)
function renderAuthorityUI() {
  const container = document.getElementById('authoritiesContainer');
  container.innerHTML = '';

  authorities.forEach((auth, idx) => {
    const box = document.createElement('div');
    box.className = 'auth-box';
    box.innerHTML = `
      <h4>Authority ${idx + 1}</h4>
      <div class="field">
        <label>Upload Signature Image</label>
        <input type="file" id="sigFile_${idx}" accept="image/*" class="glass-input" />
      </div>
      <div class="field-row">
        <div class="field">
          <label>Name</label>
          <input type="text" id="authName_${idx}" value="${auth.name}" class="glass-input" />
        </div>
        <div class="field">
          <label>Designation</label>
          <input type="text" id="authDesig_${idx}" value="${auth.desig}" class="glass-input" />
        </div>
      </div>
    `;
    container.appendChild(box);
  });
}

document.getElementById('addAuthBtn').addEventListener('click', () => {
  if (authorities.length >= 4) {
    alert('Maximum 4 authorities supported.');
    return;
  }
  const id = authorities.length + 1;
  const spacing = 1000 / (authorities.length + 2);
  authorities.push({
    id: id,
    name: `Authority ${id} Name`,
    desig: `Designation ${id}`,
    sigImg: null,
    sigX: spacing * id,
    sigY: 460,
    w: 120,
    h: 50,
    textX: spacing * id,
    nameY: 530,
    desigY: 555
  });

  // Re-balance existing X coordinates dynamically
  const newSpacing = 1000 / (authorities.length + 1);
  authorities.forEach((a, i) => {
    a.sigX = newSpacing * (i + 1);
    a.textX = newSpacing * (i + 1);
  });

  renderAuthorityUI();
  render();
});

document.getElementById('removeAuthBtn').addEventListener('click', () => {
  if (authorities.length <= 1) {
    alert('At least one authority is required.');
    return;
  }
  authorities.pop();

  const newSpacing = 1000 / (authorities.length + 1);
  authorities.forEach((a, i) => {
    a.sigX = newSpacing * (i + 1);
    a.textX = newSpacing * (i + 1);
  });

  renderAuthorityUI();
  render();
});

document.getElementById('applyAuthoritiesBtn').addEventListener('click', () => {
  authorities.forEach((auth, idx) => {
    auth.name = document.getElementById(`authName_${idx}`).value;
    auth.desig = document.getElementById(`authDesig_${idx}`).value;

    const sigFile = document.getElementById(`sigFile_${idx}`).files[0];
    if (sigFile) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        auth.sigImg = new Image();
        auth.sigImg.onload = () => render();
        auth.sigImg.src = ev.target.result;
      };
      reader.readAsDataURL(sigFile);
    }
  });
  render();
});

// Presets Gallery Setup
function buildPresetGallery() {
  const grid = document.getElementById('templateGrid');
  grid.innerHTML = '';
  presetThemes.forEach((t, i) => {
    const card = document.createElement('div');
    card.className = `template-card ${i === currentTemplateIndex ? 'active' : ''}`;
    card.innerHTML = `<div class="preview-box" style="background:${t.bg}; border: 4px solid ${t.primary}"></div><h4>${t.name}</h4>`;
    card.addEventListener('click', () => {
      document.querySelectorAll('.template-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      currentTemplateIndex = i;
    });
    grid.appendChild(card);
  });
}

document.getElementById('applyPresetBtn').addEventListener('click', () => {
  customTemplateImg = null;
  currentBorderStyle = document.getElementById('borderStyleSelect').value;
  render();
});

// Modal Logic
document.querySelectorAll('.menu-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.glass-modal').forEach(m => m.classList.remove('active'));
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const modalId = btn.getAttribute('data-modal');
    if (modalId) document.getElementById(modalId).classList.add('active');
  });
});

document.querySelectorAll('.close-modal').forEach(b => {
  b.addEventListener('click', () => b.closest('.glass-modal').classList.remove('active'));
});

// Downloads Engine
function triggerDownload(dataUrl, fileName) {
  const a = document.createElement('a');
  a.download = fileName;
  a.href = dataUrl;
  a.click();
}

document.getElementById('downloadSinglePngBtn').addEventListener('click', () => {
  triggerDownload(canvas.toDataURL('image/png'), `${elements.name.text}_Certificate.png`);
});

document.getElementById('downloadSinglePdfBtn').addEventListener('click', () => {
  const pdf = new jsPDF('l', 'px', [canvas.width, canvas.height]);
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
  pdf.save(`${elements.name.text}_Certificate.pdf`);
});

function downloadBatchFiles(format) {
  if (!recipientList || recipientList.length === 0) {
    alert("No recipients list available for batch generation.");
    return;
  }

  recipientList.forEach((name, index) => {
    setTimeout(() => {
      elements.name.text = name;
      render();
      if (format === 'png') {
        triggerDownload(canvas.toDataURL('image/png'), `${name}_Certificate.png`);
      } else {
        const pdf = new jsPDF('l', 'px', [canvas.width, canvas.height]);
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${name}_Certificate.pdf`);
      }
    }, index * 400);
  });
}

document.getElementById('downloadBatchSeparatePngBtn').addEventListener('click', () => downloadBatchFiles('png'));
document.getElementById('downloadBatchSeparatePdfBtn').addEventListener('click', () => downloadBatchFiles('pdf'));
document.getElementById('enterpriseBatchDownloadBtn').addEventListener('click', () => downloadBatchFiles('pdf'));

// Mode Toggles
document.getElementById('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
});

document.getElementById('gridToggle').addEventListener('click', () => {
  showGrid = !showGrid;
  render();
});

// Startup Initialization
buildPresetGallery();
renderAuthorityUI();
updateRecipientDropdown();
syncFontStudioUI();
render();