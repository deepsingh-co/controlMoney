/* Statement import: read a PDF locally, extract debit lines, and save them. */
(function () {
  "use strict";

  var input = document.getElementById("fileInput");
  var dropzone = document.getElementById("dropzone");
  var statusPanel = document.getElementById("uploadStatus");
  var statusIconUse = document.getElementById("statusIconUse");
  var statusTitle = document.getElementById("statusTitle");
  var statusText = document.getElementById("statusText");
  var resultsPanel = document.getElementById("resultsPanel");
  var parsedList = document.getElementById("parsedList");
  var parsedCount = document.getElementById("parsedCount");
  var uploadAnother = document.getElementById("uploadAnother");

  if (!input || !dropzone) return;

  var MAX_BYTES = 15 * 1024 * 1024;
  var busy = false;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var moneyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  var dateFormatter = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  var STATUS_ICONS = {
    loading: "i-file-up",
    success: "i-check",
    warning: "i-alert",
    error: "i-alert",
    info: "i-info",
  };

  if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js";
  }

  function setStatus(state, title, text) {
    if (!statusPanel) return;
    statusPanel.hidden = false;
    statusPanel.className = "status-panel" + (state ? " is-" + state : "");
    if (statusIconUse) {
      statusIconUse.setAttribute("href", "#" + (STATUS_ICONS[state] || "i-info"));
    }
    if (statusTitle) statusTitle.textContent = title;
    if (statusText) statusText.textContent = text || "";
  }

  function clearStatus() {
    if (!statusPanel) return;
    statusPanel.hidden = true;
    statusPanel.className = "status-panel";
    if (statusTitle) statusTitle.textContent = "";
    if (statusText) statusText.textContent = "";
  }

  function clearResults() {
    if (resultsPanel) resultsPanel.hidden = true;
    if (parsedList) parsedList.replaceChildren();
    if (parsedCount) parsedCount.textContent = "0";
  }

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(reader.error || new Error("Could not read file"));
      };
      reader.readAsArrayBuffer(file);
    });
  }

  function pageLines(textContent) {
    var items = textContent && Array.isArray(textContent.items) ? textContent.items : [];
    var rows = new Map();

    items.forEach(function (item) {
      if (!item || typeof item.str !== "string" || !item.str.trim()) return;
      var transform = Array.isArray(item.transform) ? item.transform : null;
      var y = transform ? Math.round(transform[5]) : 0;
      var x = transform ? transform[4] : 0;
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push({ x: x, text: item.str });
    });

    var lines = [];
    Array.from(rows.keys())
      .sort(function (a, b) {
        return b - a;
      })
      .forEach(function (y) {
        var line = rows
          .get(y)
          .sort(function (a, b) {
            return a.x - b.x;
          })
          .map(function (item) {
            return item.text;
          })
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        if (line) lines.push(line);
      });
    return lines;
  }

  async function extractLines(pdf) {
    var lines = [];
    for (var pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      var page = await pdf.getPage(pageNumber);
      var textContent = await page.getTextContent();
      lines = lines.concat(pageLines(textContent));
    }
    return lines;
  }

  function pad(number) {
    return number < 10 ? "0" + number : String(number);
  }

  function toIsoDate(value) {
    var parts = value.split("-").map(Number);
    if (parts.length !== 3) return null;
    var date = new Date(parts[2], parts[1] - 1, parts[0]);
    if (
      date.getFullYear() !== parts[2] ||
      date.getMonth() !== parts[1] - 1 ||
      date.getDate() !== parts[0]
    ) {
      return null;
    }
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  function parseLines(lines) {
    var pattern = /(\d{2}-\d{2}-\d{4})\s+(.+?)\s+([\d,]+\.\d{2})\s*\(\s*dr\s*\)/gi;
    var found = [];
    var seen = new Set();

    lines.forEach(function (line) {
      var matches = line.matchAll(pattern);
      Array.from(matches).forEach(function (match) {
        var isoDate = toIsoDate(match[1]);
        var amount = Number(match[3].replace(/,/g, ""));
        if (!isoDate || !Number.isFinite(amount) || amount <= 0) return;

        var description = match[2].replace(/\s+/g, " ").trim().slice(0, 120);
        if (!description) description = "Bank transaction";

        var key = isoDate + "|" + amount.toFixed(2) + "|" + description.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);

        found.push({
          date: isoDate,
          amount: Math.round(amount * 100) / 100,
          category: "Bank",
          description: description,
        });
      });
    });

    return found;
  }

  function existingKey(expense) {
    var date = typeof expense.date === "string" ? expense.date.slice(0, 10) : "";
    var amount = Number(expense.amount);
    if (!Number.isFinite(amount)) amount = 0;
    var description =
      typeof expense.description === "string" ? expense.description.trim().toLowerCase() : "";
    return date + "|" + amount.toFixed(2) + "|" + description + "|" + (expense.category || "");
  }

  function saveExpenses(entries) {
    var existing = [];
    try {
      existing = JSON.parse(localStorage.getItem("expenses") || "[]");
    } catch (error) {
      existing = [];
    }
    if (!Array.isArray(existing)) existing = [];

    var keys = new Set(existing.map(existingKey));
    var fresh = [];
    var duplicates = 0;

    entries.forEach(function (entry) {
      var key =
        entry.date +
        "|" +
        entry.amount.toFixed(2) +
        "|" +
        entry.description.toLowerCase() +
        "|" +
        entry.category;
      if (keys.has(key)) {
        duplicates += 1;
        return;
      }
      keys.add(key);
      fresh.push(entry);
    });

    if (!fresh.length) {
      return { fresh: fresh, duplicates: duplicates, error: false };
    }

    existing.push.apply(existing, fresh);
    try {
      localStorage.setItem("expenses", JSON.stringify(existing));
    } catch (error) {
      return { fresh: [], duplicates: duplicates, error: true };
    }
    return { fresh: fresh, duplicates: duplicates, error: false };
  }

  function renderResults(entries) {
    if (!resultsPanel || !parsedList) return;

    var fragment = document.createDocumentFragment();
    entries.forEach(function (entry) {
      var item = document.createElement("li");
      item.className = "parsed-item";

      var date = document.createElement("span");
      date.className = "parsed-date";
      date.textContent = dateFormatter.format(new Date(entry.date + "T00:00:00"));

      var name = document.createElement("span");
      name.className = "parsed-name";
      name.textContent = entry.description;

      var amount = document.createElement("span");
      amount.className = "parsed-amount";
      amount.textContent = "−" + moneyFormatter.format(entry.amount);

      item.append(date, name, amount);
      fragment.appendChild(item);
    });

    parsedList.replaceChildren(fragment);
    if (parsedCount) parsedCount.textContent = String(entries.length);
    resultsPanel.hidden = false;
  }

  async function handleFile(file) {
    if (busy || !file) return;

    var isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (!isPdf) {
      setStatus(
        "error",
        "That file isn't a PDF",
        "Choose a PDF bank statement exported from your bank."
      );
      return;
    }

    if (file.size > MAX_BYTES) {
      setStatus("error", "That file is too large", "Choose a PDF smaller than 15 MB.");
      return;
    }

    if (!window.pdfjsLib) {
      setStatus(
        "error",
        "The PDF reader didn't load",
        "Check your internet connection, then reload this page and try again."
      );
      return;
    }

    busy = true;
    dropzone.classList.add("is-busy");
    clearResults();
    setStatus("loading", "Reading " + file.name, "Extracting text and looking for debit lines…");

    try {
      var buffer = await readFile(file);
      var pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
      var lines = await extractLines(pdf);
      var entries = parseLines(lines);

      if (!entries.length) {
        setStatus(
          "warning",
          "No debit transactions found",
          "This PDF had no lines shaped like DD-MM-YYYY … amount(Dr). It may be scanned or use a different layout."
        );
        return;
      }

      var result = saveExpenses(entries);

      if (result.error) {
        setStatus(
          "error",
          "Couldn't save the transactions",
          "This browser blocked local storage. Check your privacy settings and try again."
        );
        return;
      }

      if (!result.fresh.length) {
        setStatus(
          "info",
          "Already imported",
          result.duplicates +
            (result.duplicates === 1
              ? " matching transaction is already in your dashboard."
              : " matching transactions are already in your dashboard.")
        );
        return;
      }

      setStatus(
        "success",
        result.fresh.length + (result.fresh.length === 1 ? " transaction imported" : " transactions imported"),
        result.duplicates
          ? result.duplicates + " duplicate line was skipped. They are saved under the Bank category."
          : "They are saved under the Bank category and ready to review."
      );
      renderResults(result.fresh);
      if (resultsPanel) {
        resultsPanel.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          block: "nearest",
        });
      }
    } catch (error) {
      setStatus(
        "error",
        "Couldn't read that PDF",
        "The file may be password-protected, damaged, or image-only. Try exporting a fresh text-based statement."
      );
    } finally {
      busy = false;
      dropzone.classList.remove("is-busy");
      input.value = "";
    }
  }

  input.addEventListener("change", function () {
    if (input.files && input.files[0]) handleFile(input.files[0]);
  });

  ["dragenter", "dragover"].forEach(function (type) {
    dropzone.addEventListener(type, function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (!busy) dropzone.classList.add("is-dragging");
    });
  });

  ["dragleave", "dragend", "drop"].forEach(function (type) {
    dropzone.addEventListener(type, function (event) {
      event.preventDefault();
      event.stopPropagation();
      dropzone.classList.remove("is-dragging");
    });
  });

  dropzone.addEventListener("drop", function (event) {
    if (busy) return;
    var file =
      event.dataTransfer && event.dataTransfer.files ? event.dataTransfer.files[0] : null;
    if (file) handleFile(file);
  });

  if (uploadAnother) {
    uploadAnother.addEventListener("click", function () {
      clearStatus();
      clearResults();
      input.value = "";
      input.focus();
      dropzone.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "center",
      });
    });
  }
})();
