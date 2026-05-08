let appState = [];
let currentLecturerId = null;

document.addEventListener("DOMContentLoaded", () => {
  initApp();

  const searchBar = document.getElementById("searchBar");
  searchBar.addEventListener("input", handleSearch);

  const reviewForm = document.getElementById("reviewForm");
  reviewForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const studentName = document.getElementById("studentName").value;
    const rating = parseInt(document.getElementById("rating").value);
    const comment = document.getElementById("comment").value;

    if (!studentName || !rating || !comment) return;

    // Find and update lecturer
    appState.forEach((faculty) => {
      const lecturer = faculty.lecturers.find((l) => l.id === currentLecturerId);
      if (lecturer) {
        lecturer.reviews.push({
          student: studentName,
          rating: rating,
          comment: comment,
        });
      }
    });

    saveState();
    renderLecturers(appState);
    closeModal();
  });

  // Close modal on outside click
  window.addEventListener("click", (e) => {
    const modal = document.getElementById("reviewModal");
    if (e.target === modal) {
      closeModal();
    }
  });
});

async function initApp() {
  const savedData = localStorage.getItem("guide_app_data");
  if (savedData) {
    appState = JSON.parse(savedData);
    renderLecturers(appState);
  } else {
    try {
      const res = await fetch("data/lecturers.json");
      const data = await res.json();
      appState = data.faculties;
      saveState();
      renderLecturers(appState);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }
}

function saveState() {
  localStorage.setItem("guide_app_data", JSON.stringify(appState));
}

function getStarRating(rating) {
  const rounded = Math.round(rating);
  return "★".repeat(rounded) + "☆".repeat(5 - rounded);
}

function renderLecturers(faculties) {
  const container = document.getElementById("lecturerList");
  container.innerHTML = "";

  if (faculties.length === 0) {
    container.innerHTML = `<div class="no-results">No lecturers found matching your search.</div>`;
    return;
  }

  faculties.forEach((faculty) => {
    const facultyDiv = document.createElement("div");
    facultyDiv.classList.add("faculty");

    const title = document.createElement("h2");
    title.textContent = faculty.name;
    facultyDiv.appendChild(title);

    faculty.lecturers.forEach((lecturer) => {
      const lecturerDiv = document.createElement("div");
      lecturerDiv.classList.add("lecturer");

      const avg = getAverageRating(lecturer.reviews);
      const starDisplay = typeof avg === "number" ? getStarRating(avg) : avg;

      lecturerDiv.innerHTML = `
        <div class="lecturer-header">
          <h3>${lecturer.name}</h3>
          <button class="btn-add-review" onclick="openModal(${lecturer.id})">Add Review</button>
        </div>
        <p><strong>Courses:</strong> ${lecturer.courses.join(", ")}</p>
        <p class="rating-display"><strong>Average Rating:</strong> <span class="stars">${starDisplay}</span> ${
        typeof avg === "number" ? `(${avg})` : ""
      }</p>
        <div class="reviews">
          ${lecturer.reviews
            .map(
              (r) => `
            <div class="review-item">
              <span class="stars">${getStarRating(r.rating)}</span>
              <p>"${r.comment}" - <strong>${r.student}</strong></p>
            </div>
          `
            )
            .join("")}
        </div>
      `;

      facultyDiv.appendChild(lecturerDiv);
    });

    container.appendChild(facultyDiv);
  });
}

function getAverageRating(reviews) {
  if (reviews.length === 0) return "No ratings yet";
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return parseFloat((total / reviews.length).toFixed(1));
}

function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  const filtered = appState
    .map((faculty) => {
      return {
        ...faculty,
        lecturers: faculty.lecturers.filter(
          (l) =>
            l.name.toLowerCase().includes(query) ||
            faculty.name.toLowerCase().includes(query) ||
            l.courses.some((c) => c.toLowerCase().includes(query))
        ),
      };
    })
    .filter((f) => f.lecturers.length > 0);

  renderLecturers(filtered);
}

// Modal Logic
function openModal(lecturerId) {
  currentLecturerId = lecturerId;
  const modal = document.getElementById("reviewModal");
  modal.style.display = "flex";
}

function closeModal() {
  currentLecturerId = null;
  const modal = document.getElementById("reviewModal");
  modal.style.display = "none";
  document.getElementById("reviewForm").reset();
}
