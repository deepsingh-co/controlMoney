/* Shared app chrome: theme toggle, mobile navigation, footer year. */
(function () {
  "use strict";

  var root = document.documentElement;
  var themeToggle = document.getElementById("themeToggle");

  function currentTheme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function syncThemeToggle() {
    if (!themeToggle) return;
    var next = currentTheme() === "dark" ? "light" : "dark";
    var label = "Switch to " + next + " theme";
    themeToggle.setAttribute("aria-label", label);
    themeToggle.setAttribute("title", label);
  }

  if (themeToggle) {
    syncThemeToggle();
    themeToggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem("theme", next);
      } catch (error) {
        /* Theme still applies for this visit. */
      }
      syncThemeToggle();
      window.dispatchEvent(
        new CustomEvent("themechange", { detail: { theme: next } })
      );
    });
  }

  var navToggle = document.getElementById("navToggle");
  var nav = document.getElementById("appNav");

  if (navToggle && nav) {
    var setNavOpen = function (open) {
      nav.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };

    navToggle.addEventListener("click", function () {
      setNavOpen(!nav.classList.contains("is-open"));
    });

    document.addEventListener("click", function (event) {
      if (
        nav.classList.contains("is-open") &&
        !nav.contains(event.target) &&
        !navToggle.contains(event.target)
      ) {
        setNavOpen(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setNavOpen(false);
        navToggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) setNavOpen(false);
    });
  }

  var loginLink = document.getElementById("loginLink");
  var profileMenu = document.getElementById("profileMenu");
  var profileTrigger = document.getElementById("profileTrigger");
  var profileDropdown = document.getElementById("profileDropdown");
  var signOutBtn = document.getElementById("signOutBtn");

  if (loginLink && profileMenu && profileTrigger && profileDropdown) {
    var storedUser = null;
    var signedIn = false;

    try {
      storedUser = JSON.parse(localStorage.getItem("user") || "null");
      signedIn = localStorage.getItem("isLoggedIn") === "true";
    } catch (error) {
      storedUser = null;
      signedIn = false;
    }

    if (
      signedIn &&
      storedUser &&
      typeof storedUser.email === "string" &&
      storedUser.email.trim()
    ) {
      var email = storedUser.email.trim();
      var displayName = email.split("@")[0];
      var initial = (displayName.charAt(0) || email.charAt(0) || "A").toUpperCase();

      document.querySelectorAll("[data-profile-email]").forEach(function (node) {
        node.textContent = email;
      });
      document.querySelectorAll("[data-profile-name]").forEach(function (node) {
        node.textContent = displayName;
      });
      document.querySelectorAll("[data-profile-avatar]").forEach(function (node) {
        node.textContent = initial;
      });
      profileTrigger.setAttribute("aria-label", "Open profile menu for " + email);
      loginLink.hidden = true;
      profileMenu.hidden = false;
    } else {
      loginLink.hidden = false;
      profileMenu.hidden = true;
    }

    var setProfileOpen = function (open) {
      profileDropdown.hidden = !open;
      profileTrigger.setAttribute("aria-expanded", open ? "true" : "false");
    };

    profileTrigger.addEventListener("click", function () {
      setProfileOpen(profileDropdown.hidden);
    });

    document.addEventListener("click", function (event) {
      if (!profileDropdown.hidden && !profileMenu.contains(event.target)) {
        setProfileOpen(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !profileDropdown.hidden) {
        setProfileOpen(false);
        profileTrigger.focus();
      }
    });

    if (signOutBtn) {
      signOutBtn.addEventListener("click", function () {
        try {
          localStorage.removeItem("isLoggedIn");
        } catch (error) {
          /* Reloading still resets the visible session. */
        }
        window.location.reload();
      });
    }
  }

  document.querySelectorAll("[data-year]").forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });
})();
