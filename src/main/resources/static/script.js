let currentEditIndex = null;
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
    <button onclick="removeProduct(this)">Remove Product</button>
  `;
  container.appendChild(row);
}

function removeProduct(button) {
  const row = button.parentElement;
  const confirmRemove = confirm(
    "Are you sure you want to remove this product?"
  );
  if (confirmRemove) row.remove();
}

async function generateQuotation() {
  const pd = document.getElementById("partyDetails").value;
  const qno = document.getElementById("quotationNo").value;
  const date = document.getElementById("date").value;
  const eno = document.getElementById("enquiryNo").value;
  const edate = document.getElementById("enquiryDate").value;

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
    <h4 style="text-align: center; margin: 0; margin-top: 20px; font-size: 26px;">National Sales Corporation</h4>
    <p style="text-align: center; margin-top: 5px;">
      M.G.Road, Jaigaon, Dist. Alipurduar, West Bengal – 736182<br>
      Telephone: 9733148724 / 03566264245 Email: nscindia2@gmail.com<br>
      Supplier of All Type Industrial Accessories, Equipments & General Order Supplier<br>
      GSTIN: 19ANLPP509P1Z0 | MSMED NO: UDYAM-WB-01-0013503
    </p>
    <div class="details-row">
      <div class="left-details">
        <div style="font-weight: bold; margin-bottom: 5px;">Party Details:</div>
        ${formattedPartyDetails}
      </div>
      <div class="right-details">
        <div>Quotation No: NSC/${qno}</div>
        <div>Dated: ${date}</div>
        <div>Enquiry No: ${eno}</div>
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
    date,
    enquiryNo: eno,
    enquiryDate: edate,
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

    alert(
      editId
        ? "Quotation updated successfully!"
        : "Quotation saved to database successfully!"
    );
  } catch (err) {
    console.error(err);
    alert("Error saving quotation to the database.");
  }
}


async function loadHistory() {
  const container = document.getElementById("historySection");
  container.innerHTML = "";

  try {
    const response = await fetch("https://nscquotation.onrender.com/api/quotations");
    const history = await response.json();

    if (history.length > 0) {
      history.forEach((entry) => {
        const div = document.createElement("div");
        div.className = "history-entry";
        div.innerHTML = `
          <div class="entry-text">
            <strong>Quotation No:</strong> NSC/${entry.quotationNo} | <strong>Date:</strong> ${entry.date?.split("T")[0] || ""}
          </div>
          <div class="button-group">
            <button class="editBtn" onclick="editQuotation('${entry.id}')">Edit</button>
            <button class="deleteBtn" onclick="deleteQuotation('${entry.id}')">Delete</button>
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
    alert("Failed to load quotation history.");
  }
}

function editQuotation(id) {
  // Store the quotation id in localStorage or pass it to the next page
  localStorage.setItem("editQuotationId", id);
  window.location.href = "nscform.html";
}

async function clearHistory() {
  const confirmClear = confirm(
    "Are you sure you want to clear all quotation history?"
  );
  if (!confirmClear) return;

  try {
    const response = await fetch("https://nscquotation.onrender.com/api/quotations", {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to clear history");
    alert("All quotations deleted successfully.");
    loadHistory();
  } catch (err) {
    console.error("Error clearing history:", err);
    alert("Failed to clear history.");
  }
}

async function deleteQuotation(id) {
  const confirmDelete = confirm(
    "Are you sure you want to delete this quotation?"
  );
  if (!confirmDelete) return;

  try {
    const response = await fetch(`https://nscquotation.onrender.com/api/quotations/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete quotation");
    alert("Quotation deleted successfully.");
    loadHistory();
  } catch (err) {
    console.error("Error deleting quotation:", err);
    alert("Failed to delete quotation.");
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
      const response = await fetch(`https://nscquotation.onrender.com/api/quotations/${editId}`);
      if (!response.ok) throw new Error("Failed to fetch quotation for editing.");

      const q = await response.json();

      document.getElementById("partyDetails").value = q.partyDetails || "";
      document.getElementById("quotationNo").value = q.quotationNo || "";
      document.getElementById("date").value = q.date?.split("T")[0] || "";
      document.getElementById("enquiryNo").value = q.enquiryNo || "";
      document.getElementById("enquiryDate").value = q.enquiryDate?.split("T")[0] || "";
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
      alert("Failed to load quotation for editing.");
    } finally {
      localStorage.removeItem("editQuotationId");
    }
  }

  // Still load history (if needed on this page)
  if (typeof loadHistory === "function") {
    loadHistory();
  }
};