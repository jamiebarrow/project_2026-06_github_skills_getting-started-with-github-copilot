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

      // Reset activity select (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> <span class="spots-left">${spotsLeft}</span> spots left</p>
        `;

      // Participants section (build DOM so we can attach handlers)
      if (details.participants && details.participants.length) {
        const participantsDiv = document.createElement('div');
        participantsDiv.className = 'participants';

        const h5 = document.createElement('h5');
        h5.textContent = 'Participants';
        participantsDiv.appendChild(h5);

        const ul = document.createElement('ul');
        ul.className = 'participants-list';

        details.participants.forEach(p => {
          const li = document.createElement('li');
          li.className = 'participant-item';

          const span = document.createElement('span');
          span.className = 'participant-email';
          span.textContent = p;

          const removeBtn = document.createElement('button');
          removeBtn.className = 'participant-remove';
          removeBtn.title = 'Remove participant';
          removeBtn.innerHTML = '✕';

          // Click handler to unregister participant
          removeBtn.addEventListener('click', async () => {
            try {
              const res = await fetch(`/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`, { method: 'POST' });
              const json = await res.json();
              if (res.ok) {
                // remove from DOM
                li.remove();
                // update spots left
                const spotsSpan = activityCard.querySelector('.spots-left');
                if (spotsSpan) {
                  const newSpots = parseInt(spotsSpan.textContent, 10) + 1;
                  spotsSpan.textContent = newSpots;
                }
                // show a brief message
                messageDiv.textContent = json.message;
                messageDiv.className = 'message success';
                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 3000);
              } else {
                messageDiv.textContent = json.detail || 'Failed to remove participant';
                messageDiv.className = 'message error';
                messageDiv.classList.remove('hidden');
              }
            } catch (err) {
              console.error('Error unregistering participant:', err);
              messageDiv.textContent = 'Failed to remove participant';
              messageDiv.className = 'message error';
              messageDiv.classList.remove('hidden');
            }
          });

          li.appendChild(span);
          li.appendChild(removeBtn);
          ul.appendChild(li);
        });

        participantsDiv.appendChild(ul);
        activityCard.appendChild(participantsDiv);
      } else {
        const p = document.createElement('p');
        p.className = 'no-participants';
        p.textContent = 'No participants yet';
        activityCard.appendChild(p);
      }

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
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh activities to show the newly registered participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
