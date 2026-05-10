let currentEditIndex = null;

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const messageSpan = document.getElementById("toast-message");

  const emoji = type === "success" ? "✅" : "❌";

  messageSpan.textContent = `${emoji} ${message}`;
  container.style.display = "block";
}
function hideToast() {
  document.getElementById("toast-container").style.display = "none";
}

async function checkPasskey() {
  const key = document.getElementById("passkey").value;

  try {
    const response = await fetch(
      "https://nscquotation.onrender.com/api/quotations/passkey?passkey=" +
        encodeURIComponent(key),
      {
        method: "POST",
      },
    );

    const data = await response.json();

    if (response.ok && data.message === "Passkey is valid") {
      window.location.href = "select.html";
    } else {
      showToast("Incorrect passkey", "error");
    }
  } catch (err) {
    console.error("Error validating passkey:", err);
    showToast("Error validating passkey", "error");
  }
}

function togglePassword() {
  const passField = document.getElementById("passkey");
  passField.type = passField.type === "password" ? "text" : "password";
}

function addProduct(product = {}) {
  const { desc = "", unit = "", gst = "", rate = "", brand = "" } = product;

  const container = document.getElementById("products");
  const row = document.createElement("div");
  row.className = "product-row";
  row.innerHTML = `
    <input placeholder="Product Description" value="${desc}" />
    <input placeholder="Unit" value="${unit}" />
    <input placeholder="GST%" value="${gst}" />
    <input placeholder="Rate" value="${rate}" />
    <input placeholder="Brand" value="${brand}" />
    <button onclick="removeProduct(this)">➖ Remove Product</button>
  `;
  container.appendChild(row);
}

function removeProduct(button) {
  const row = button.parentElement;
  const confirmRemove = confirm(
    "Are you sure you want to remove this product?",
  );
  if (confirmRemove) row.remove();
}

function handleExcelImport(event) {
  const file = event.target.files[0];

  if (!file) {
    showToast("No file selected", "error");
    return;
  }

  // Check if XLSX library is available
  if (typeof XLSX === "undefined") {
    showToast(
      "Excel library not loaded. Please try uploading a CSV file instead.",
      "error",
    );
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  const isCSV = file.name.toLowerCase().endsWith(".csv");

  reader.onload = function (e) {
    try {
      let jsonData;

      if (isCSV) {
        // Handle CSV files
        const text = e.target.result;
        jsonData = parseCSV(text);
      } else {
        // Handle Excel files
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        jsonData = XLSX.utils.sheet_to_json(worksheet);
      }

      if (jsonData.length === 0) {
        showToast("No data found in file", "error");
        return;
      }

      // Clear existing products
      const productsContainer = document.getElementById("products");
      productsContainer.innerHTML = "";

      // Expected headers (case-insensitive matching)
      const headerMapping = {
        productdescription: "desc",
        "product description": "desc",
        description: "desc",
        product: "desc",
        unit: "unit",
        "gst%": "gst",
        gst: "gst",
        rate: "rate",
        price: "rate",
        brand: "brand",
      };

      // Process each row
      let successCount = 0;
      jsonData.forEach((row, index) => {
        const product = {
          desc: "",
          unit: "",
          gst: "",
          rate: "",
          brand: "",
        };

        // Map Excel columns to product fields
        for (const [excelKey, value] of Object.entries(row)) {
          const normalizedKey = excelKey.toLowerCase().trim();
          const mappedField = headerMapping[normalizedKey];

          if (mappedField && value !== undefined && value !== null) {
            product[mappedField] = String(value).trim();
          }
        }

        // Only add product if it has at least a description
        if (product.desc) {
          addProduct(product);
          successCount++;
        }
      });

      if (successCount > 0) {
        showToast(
          `Successfully imported ${successCount} product(s)`,
          "success",
        );
      } else {
        showToast("No valid products found in file", "error");
      }

      // Reset file input
      event.target.value = "";
    } catch (error) {
      console.error("Error parsing file:", error);
      showToast(
        "Error parsing file. Make sure it's a valid Excel or CSV file.",
        "error",
      );
      event.target.value = "";
    }
  };

  reader.onerror = function () {
    showToast("Error reading file", "error");
    event.target.value = "";
  };

  if (isCSV) {
    reader.readAsText(file);
  } else {
    reader.readAsArrayBuffer(file);
  }
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length === 0) return [];

  // Parse header
  const header = parseCSVLine(lines[0]);

  // Parse data rows
  const jsonData = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "") continue; // Skip empty lines

    const values = parseCSVLine(lines[i]);
    const row = {};

    header.forEach((key, index) => {
      row[key] = values[index] || "";
    });

    jsonData.push(row);
  }

  return jsonData;
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function formatDateToDDMMYYYY(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

async function generateQuotation() {
  const pd = document.getElementById("partyDetails").value;
  const qno = document.getElementById("quotationNo").value;
  const rawDate = document.getElementById("date").value;
  const rawEDate = document.getElementById("enquiryDate").value;
  const date = formatDateToDDMMYYYY(rawDate);
  const edate = formatDateToDDMMYYYY(rawEDate);

  const eno = document.getElementById("enquiryNo").value;
  const tax = document.getElementById("tax").value;
  const delivery = document.getElementById("delivery").value;
  const payment = document.getElementById("payment").value;
  const validity = document.getElementById("validity").value;
  const freight = document.getElementById("freight").value;

  const productList = [];
  document.querySelectorAll(".product-row").forEach((row) => {
    const inputs = row.querySelectorAll("input");
    const [desc, unit, gst, rate, brand] = [...inputs].map((i) => i.value);
    productList.push({ desc, unit, gst, rate, brand });
  });

  const formattedPartyDetails = pd.replace(/\n/g, "<br>");
  let productRows = "";
  productList.forEach((p, idx) => {
    productRows += `
      <tr>
        <td>${idx + 1}</td>
        <td>${p.desc}</td>
        <td>${p.unit}</td>
        <td>${p.gst}</td>
        <td>${p.rate}</td>
        <td>${p.brand}</td>
      </tr>
    `;
  });

  const quotationHTML = `
    <h2>QUOTATION</h2>
    <div class="details-row">
      <div class="left-details" style=" max-width: 600px;">
        <h4 style="margin: 0; font-size: 22px; display: flex; align-items: center; gap: 5px; white-space: nowrap;">
        <img src="NSC Logo-01.png" alt="NSC Logo" style="width: 35px; height: 35px;" />National Sales Corporation</h4>
        <p style="line-height: 1.6; margin-top: 5px; width: 300px;">
          M.G.Road, Jaigaon, Dist. Alipurduar,<br> West Bengal – 736182<br>
          (Supplier of All Type Industrial Accessories, Equipments & General Order Supplier)
        </p>
      </div>
      <div class="right-details" style="margin-top: 10px;">
        <div>Telephone: 9733148724 / 03566264245</div>
        <div>Email: nscindia2@gmail.com</div>
        <div>GSTIN: 19ANLPP5090P1Z0</div>
        <div>MSMED NO: UDYAM-WB-01-0013503</div>
        <div>IEC: ANLPP5090P1Z</div>
      </div>
    </div>
    <div class="details-row">
      <div class="left-details">
        <div style="font-weight: bold; margin-bottom: 5px;">Party Details:</div>
        ${formattedPartyDetails}
      </div>
      <div class="right-details">
        <div>Quotation No.: NSC/${qno}</div>
        <div>Quotation Date: ${date}</div>
        <div>Enquiry No.: ${eno}</div>
        <div>Enquiry Date: ${edate}</div>
      </div>
    </div>
    <p>Sir / Madam,<br>
    With reference to the above enquiry, we are pleased in submitting our offer as per the terms and conditions mentioned below:</p>
    <table>
      <thead>
        <tr>
          <th>Sl. No.</th>
          <th>Product Description</th>
          <th>Unit</th>
          <th>GST%</th>
          <th>Rate</th>
          <th>Brand</th>
        </tr>
      </thead>
      <tbody>${productRows}</tbody>
    </table>
    <div class="terms" style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <p><strong>Terms & Conditions:</strong></p>
        <p>1. Tax – ${tax}</p>
        <p>2. Delivery – ${delivery}</p>
        <p>3. Payment – ${payment}</p>
        <p>4. Validity – ${validity}</p>
        <p>5. Freight – ${freight}</p>
      </div>
      <div style="text-align: center; margin-top: 15px;">
        <div><strong>For National Sales Corporation</strong></div>
        <img src="signature.png" alt="Signature" style="width: 150px; margin-left: 15px;" />
        <div><strong>Authorized Signatory</strong></div>
      </div>
    </div>`;

  document.getElementById("quotationOutput").innerHTML = quotationHTML;

  const newEntry = {
    partyDetails: pd,
    quotationNo: qno,
    date: rawDate,
    enquiryNo: eno,
    enquiryDate: rawEDate,
    tax,
    delivery,
    payment,
    validity,
    freight,
    products: productList,
  };

  try {
    const editId = window.currentEditId || null;
    const method = editId ? "PUT" : "POST";
    const url = editId
      ? `https://nscquotation.onrender.com/api/quotations/${editId}`
      : `https://nscquotation.onrender.com/api/quotations`;

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newEntry),
    });

    if (!response.ok) throw new Error("Failed to save quotation");

    const data = await response.json();
    console.log("Quotation saved:", data);

    showToast(
      editId
        ? "Quotation updated successfully"
        : "Quotation saved successfully",
      "success",
    );
  } catch (err) {
    console.error(err);
    showToast("Error saving quotation", "error");
  }
}

async function loadHistory() {
  const container = document.getElementById("historySection");
  container.innerHTML = "";

  try {
    const response = await fetch(
      "https://nscquotation.onrender.com/api/quotations",
    );
    const history = await response.json();

    if (history.length > 0) {
      history.forEach((entry) => {
        const div = document.createElement("div");
        div.className = "history-entry";
        div.innerHTML = `
          <div class="entry-text">
            <strong>Quotation No:</strong> NSC/${
              entry.quotationNo
            } | <strong>Date:</strong> ${formatDateToDDMMYYYY(entry.date)}
          </div>
          <div class="button-group">
            <button class="editBtn" onclick="editQuotation('${
              entry.id
            }')">Edit</button>
            <button class="deleteBtn" onclick="deleteQuotation('${
              entry.id
            }')">Delete</button>
          </div>
        `;
        container.appendChild(div);
      });

      const clearBtn = document.createElement("button");
      clearBtn.className = "clearHistoryBtn";
      clearBtn.textContent = "Clear All Quotations";
      clearBtn.onclick = clearHistory;
      clearBtn.style.marginTop = "20px";
      container.appendChild(clearBtn);
    } else {
      container.innerHTML = "<p>No quotations found.</p>";
    }
  } catch (err) {
    console.error("Failed to load history:", err);
    showToast("Failed to load history", "error");
  }
}

function editQuotation(id) {
  // Store the quotation id in localStorage or pass it to the next page
  localStorage.setItem("editQuotationId", id);
  window.location.href = "nscform.html";
}

async function clearHistory() {
  const confirmClear = confirm(
    "Are you sure you want to clear all quotation history?",
  );
  if (!confirmClear) return;

  try {
    const response = await fetch(
      "https://nscquotation.onrender.com/api/quotations",
      {
        method: "DELETE",
      },
    );

    if (!response.ok) throw new Error("Failed to clear history");
    showToast("Cleared history successfully", "success");
    loadHistory();
  } catch (err) {
    console.error("Error clearing history:", err);
    showToast("Failed to clear history.", "error");
  }
}

async function deleteQuotation(id) {
  const confirmDelete = confirm(
    "Are you sure you want to delete this quotation?",
  );
  if (!confirmDelete) return;

  try {
    const response = await fetch(
      `https://nscquotation.onrender.com/api/quotations/${id}`,
      {
        method: "DELETE",
      },
    );
    if (!response.ok) throw new Error("Failed to delete quotation");
    showToast("Quotation deleted successfully", "success");
    loadHistory();
  } catch (err) {
    console.error("Error deleting quotation:", err);
    showToast("Failed to delete quotation.", "error");
  }
}

function downloadPDF() {
  const quotation = document.getElementById("quotationOutput");
  const opt = {
    margin: [0.2, 0.2, 0.2, 0.2],
    filename: "NSC_Quotation.pdf",
    image: { type: "jpeg", quality: 1 },
    html2canvas: { scale: 5, scrollY: 0, useCORS: true },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["css"] },
  };

  html2pdf().set(opt).from(quotation).save();
}

window.onload = async function () {
  const editId = localStorage.getItem("editQuotationId");
  window.currentEditId = editId;

  if (editId) {
    try {
      const response = await fetch(
        `https://nscquotation.onrender.com/api/quotations/${editId}`,
      );
      if (!response.ok)
        throw new Error("Failed to fetch quotation for editing.");

      const q = await response.json();

      document.getElementById("partyDetails").value = q.partyDetails || "";
      document.getElementById("quotationNo").value = q.quotationNo || "";
      document.getElementById("date").value = q.date?.split("T")[0] || "";
      document.getElementById("enquiryNo").value = q.enquiryNo || "";
      document.getElementById("enquiryDate").value =
        q.enquiryDate?.split("T")[0] || "";
      document.getElementById("tax").value = q.tax || "";
      document.getElementById("delivery").value = q.delivery || "";
      document.getElementById("payment").value = q.payment || "";
      document.getElementById("validity").value = q.validity || "";
      document.getElementById("freight").value = q.freight || "";

      // Load products
      const container = document.getElementById("products");
      container.innerHTML = "";
      if (q.products && Array.isArray(q.products)) {
        q.products.forEach((p) => addProduct(p));
      }
      console.log("Loaded products:", q.products);
    } catch (err) {
      console.error("Failed to load quotation:", err);
      showToast("Failed to load quotation", "error");
    } finally {
      localStorage.removeItem("editQuotationId");
    }
  }

  // Still load history (if needed on this page)
  if (typeof loadHistory === "function") {
    loadHistory();
  }
};
