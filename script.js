// LocalStorage key
const STORAGE_KEY = "eduvision-courses";

// Elements
const courseModal = document.getElementById("courseModal");
const btnNewCourse = document.getElementById("btnNewCourse");
const saveCourse = document.getElementById("saveCourse");
const closeModal = document.getElementById("closeModal");
const coursesList = document.getElementById("coursesList");
const mainContent = document.getElementById("mainContent");

// Form inputs
const courseTitle = document.getElementById("courseTitle");
const courseCategory = document.getElementById("courseCategory");
const courseDescription = document.getElementById("courseDescription");

// Load saved courses
let courses = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// Index of the course currently shown in the main panel (null = welcome screen)
let openIndex = null;

// Escape user text before putting it into innerHTML
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// How much of a course is finished, as a whole number from 0 to 100
function percentDone(course) {
    if (course.lessons.length === 0) return 0;
    const done = course.lessons.filter(l => l.done).length;
    return Math.round((done / course.lessons.length) * 100);
}

// -----------------------------
// UI UPDATE
// -----------------------------
function renderCourses() {
    coursesList.innerHTML = "";

    courses.forEach((course, index) => {
        const div = document.createElement("div");
        div.className = "course-card" + (index === openIndex ? " active" : "");
        div.innerHTML = `
            <strong>${escapeHtml(course.title)}</strong>
            <p>${escapeHtml(course.category)}</p>
            <div class="bar small"><span style="width: ${percentDone(course)}%"></span></div>
        `;
        div.onclick = () => openCourse(index);
        coursesList.appendChild(div);
    });

    updateStats();
}

function updateStats() {
    document.getElementById("statCourses").textContent = courses.length;

    let totalLessons = 0;
    let completed = 0;

    courses.forEach(c => {
        totalLessons += c.lessons.length;
        completed += c.lessons.filter(l => l.done).length;
    });

    document.getElementById("statLessons").textContent = totalLessons;
    document.getElementById("statCompleted").textContent = completed;
}

function openCourse(index) {
    const course = courses[index];
    openIndex = index;

    mainContent.innerHTML = `
        <h1>${escapeHtml(course.title)}</h1>
        <p>${escapeHtml(course.description)}</p>
        <p class="progress" id="courseProgress"></p>
        <div class="bar"><span id="courseBar"></span></div>
        <h3>Lessons</h3>
        <div id="lessonList"></div>

        <div class="lesson-form">
            <input type="text" id="lessonTitle" placeholder="Lesson title">
            <button class="btn" id="addLessonBtn">+ Add Lesson</button>
        </div>

        <button class="btn-danger" id="deleteCourseBtn">Delete course</button>
    `;

    const lessonTitle = document.getElementById("lessonTitle");

    const addLesson = () => {
        const title = lessonTitle.value.trim();
        if (!title) return;
        course.lessons.push({ title, done: false });
        lessonTitle.value = "";
        save();
        renderLessons(index);
        lessonTitle.focus();
    };

    document.getElementById("deleteCourseBtn").onclick = () => deleteCourse(index);
    document.getElementById("addLessonBtn").onclick = addLesson;
    lessonTitle.onkeydown = (e) => {
        if (e.key === "Enter") addLesson();
    };

    renderCourses();
    renderLessons(index);
}

function renderLessons(courseIndex) {
    const lessonList = document.getElementById("lessonList");
    const course = courses[courseIndex];

    lessonList.innerHTML = "";

    if (course.lessons.length === 0) {
        lessonList.innerHTML = `<p class="empty">No lessons yet. Add your first one below.</p>`;
    }

    course.lessons.forEach((lesson, i) => {
        const row = document.createElement("div");
        row.className = "course-card lesson" + (lesson.done ? " done" : "");
        row.innerHTML = `
            <label>
                <input type="checkbox" ${lesson.done ? "checked" : ""} data-i="${i}">
                <span>${escapeHtml(lesson.title)}</span>
            </label>
            <button class="remove-lesson" data-i="${i}" aria-label="Delete lesson ${escapeHtml(lesson.title)}">&times;</button>
        `;
        lessonList.appendChild(row);
    });

    // Delete lesson
    document.querySelectorAll("#lessonList .remove-lesson").forEach(button => {
        button.onclick = () => {
            course.lessons.splice(Number(button.getAttribute("data-i")), 1);
            save();
            renderLessons(courseIndex);
        };
    });

    // Checkbox event
    document.querySelectorAll("#lessonList input").forEach(box => {
        box.onchange = (e) => {
            const i = e.target.getAttribute("data-i");
            course.lessons[i].done = e.target.checked;
            save();
            renderLessons(courseIndex);
        };
    });

    const done = course.lessons.filter(l => l.done).length;
    document.getElementById("courseProgress").textContent =
        `${done} of ${course.lessons.length} lessons completed (${percentDone(course)}%)`;
    document.getElementById("courseBar").style.width = percentDone(course) + "%";
}

// Remove a course and everything in it, after asking first
function deleteCourse(index) {
    const course = courses[index];
    if (!confirm(`Delete "${course.title}" and its ${course.lessons.length} lessons?`)) return;

    courses.splice(index, 1);
    openIndex = null;
    mainContent.innerHTML = `
        <h1>Welcome to EduVision</h1>
        <p>Select a course or create a new one to begin.</p>
    `;
    save();
}

// -----------------------------
// MODAL HANDLERS
// -----------------------------
btnNewCourse.onclick = () => {
    courseTitle.value = "";
    courseCategory.value = "";
    courseDescription.value = "";

    courseModal.style.display = "flex";
    courseTitle.focus();
};

closeModal.onclick = () => courseModal.style.display = "none";

saveCourse.onclick = () => {
    const title = courseTitle.value.trim();

    // A course needs a title
    if (!title) {
        courseTitle.focus();
        return;
    }

    const course = {
        title,
        category: courseCategory.value.trim(),
        description: courseDescription.value.trim(),
        lessons: []
    };

    courses.push(course);
    save();
    courseModal.style.display = "none";
    openCourse(courses.length - 1);
};

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
    renderCourses();
}

// Initialize
renderCourses();
