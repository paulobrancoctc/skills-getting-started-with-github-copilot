document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.replaceChildren(activitySelect.options[0]);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="availability-count">${spotsLeft} spots left</span></p>
        `;
        const availabilityCount = activityCard.querySelector(".availability-count");

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";

        const participantsList = document.createElement("ul");
        const showEmptyState = () => {
          const emptyState = document.createElement("li");
          emptyState.className = "empty-participants";
          emptyState.textContent = "No participants yet";
          participantsList.appendChild(emptyState);
        };

        details.participants.forEach((email) => {
          const participantRow = document.createElement("li");
          const participantEmail = document.createElement("span");
          participantEmail.className = "participant-email";
          participantEmail.textContent = email;

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "remove-participant";
          removeButton.setAttribute("aria-label", `Unregister ${email} from ${name}`);
          removeButton.title = "Unregister participant";

          const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          icon.setAttribute("viewBox", "0 0 24 24");
          icon.setAttribute("aria-hidden", "true");
          const iconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
          iconPath.setAttribute("d", "M3 6h18M8 6V4h8v2M5 6l1 14h12l1-14M10 10v6m4-6v6");
          iconPath.setAttribute("fill", "none");
          iconPath.setAttribute("stroke", "currentColor");
          iconPath.setAttribute("stroke-linecap", "round");
          iconPath.setAttribute("stroke-linejoin", "round");
          iconPath.setAttribute("stroke-width", "1.8");
          icon.appendChild(iconPath);
          removeButton.appendChild(icon);

          removeButton.addEventListener("click", async () => {
            removeButton.disabled = true;
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );
              const result = await response.json();

              if (!response.ok) {
                throw new Error(result.detail || "Failed to unregister participant");
              }

              const participantIndex = details.participants.indexOf(email);
              if (participantIndex !== -1) {
                details.participants.splice(participantIndex, 1);
              }
              participantRow.remove();
              availabilityCount.textContent = `${details.max_participants - details.participants.length} spots left`;
              if (details.participants.length === 0) {
                showEmptyState();
              }
            } catch (error) {
              removeButton.disabled = false;
              messageDiv.textContent = error.message || "Failed to unregister participant";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
            }
          });

          participantRow.append(participantEmail, removeButton);
          participantsList.appendChild(participantRow);
        });

        if (details.participants.length === 0) {
          showEmptyState();
        }

        participantsSection.append(participantsHeading, participantsList);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
