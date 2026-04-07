const PREFERENCES_STORAGE_KEY = 'routinePreferences';

// Save the user's current form selections to localStorage
function savePreferences() {
  const timeOfDay = document.getElementById('timeOfDay').value;
  const focusArea = document.getElementById('focusArea').value;
  const timeAvailable = document.getElementById('timeAvailable').value;
  const energyLevel = document.getElementById('energyLevel').value;
  const selectedActivityElements = document.querySelectorAll('input[name="activities"]:checked');
  const preferredActivities = Array.from(selectedActivityElements).map((activity) => activity.value);

  const preferences = {
    timeOfDay,
    focusArea,
    timeAvailable,
    energyLevel,
    preferredActivities
  };

  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
}

// Load saved preferences from localStorage and apply them to the form
function loadPreferences() {
  const savedPreferences = localStorage.getItem(PREFERENCES_STORAGE_KEY);

  if (!savedPreferences) {
    return;
  }

  const preferences = JSON.parse(savedPreferences);

  if (preferences.timeOfDay) {
    document.getElementById('timeOfDay').value = preferences.timeOfDay;
  }

  if (preferences.focusArea) {
    document.getElementById('focusArea').value = preferences.focusArea;
  }

  if (preferences.timeAvailable) {
    document.getElementById('timeAvailable').value = preferences.timeAvailable;
  }

  if (preferences.energyLevel) {
    document.getElementById('energyLevel').value = preferences.energyLevel;
  }

  if (Array.isArray(preferences.preferredActivities)) {
    const activityCheckboxes = document.querySelectorAll('input[name="activities"]');

    activityCheckboxes.forEach((checkbox) => {
      checkbox.checked = preferences.preferredActivities.includes(checkbox.value);
    });
  }
}

// Restore saved preferences when the page first loads
document.addEventListener('DOMContentLoaded', () => {
  loadPreferences();

  // Save preferences anytime the user changes any form control
  const formControls = document.querySelectorAll('#routineForm select, #routineForm input[name="activities"]');
  formControls.forEach((control) => {
    control.addEventListener('change', savePreferences);
  });
});

// Add an event listener to the form that runs when the form is submitted
document.getElementById('routineForm').addEventListener('submit', async (e) => {
  // Prevent the form from refreshing the page
  e.preventDefault();
  
  // Get values from dropdown inputs
  const timeOfDay = document.getElementById('timeOfDay').value;
  const focusArea = document.getElementById('focusArea').value;
  const timeAvailable = document.getElementById('timeAvailable').value;
  const energyLevel = document.getElementById('energyLevel').value;

  // Get all checked activity checkboxes, then turn them into an array of text values
  const selectedActivityElements = document.querySelectorAll('input[name="activities"]:checked');
  const preferredActivities = Array.from(selectedActivityElements).map((activity) => activity.value);

  // If nothing is selected, send a friendly fallback value to the prompt
  const preferredActivitiesText = preferredActivities.length > 0
    ? preferredActivities.join(', ')
    : 'No specific activities selected';

  // Save the latest preferences when the form is submitted
  savePreferences();

  // Build the user prompt from form choices
  const userPrompt = `Create a personalized daily routine based on the following preferences:\n\nTime of day: ${timeOfDay}\nFocus area: ${focusArea}\nTime available: ${timeAvailable} minutes\nEnergy level: ${energyLevel}\nPreferred activities: ${preferredActivitiesText}\n\nPlease provide a structured, step-by-step routine that fits these exact parameters. Keep it realistic, clear, and easy to follow.`;
  
  // Find the submit button and update its appearance to show loading state
  const button = document.querySelector('button[type="submit"]');
  button.textContent = 'Generating...';
  button.disabled = true;
  
  try {    
    // Make the API call to OpenAI's chat completions endpoint
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [      
          { role: 'system', content: `You are a helpful assistant that creates quick, focused daily routines. Always keep routines short, realistic, and tailored to the user's preferences.` },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_completion_tokens: 500
      })
    });
    
    // Convert API response to JSON and get the generated routine
    const data = await response.json();
    const routine = data.choices[0].message.content;
    
    // Show the result section and display the routine
    document.getElementById('result').classList.remove('hidden');
    document.getElementById('routineOutput').textContent = routine;
    
  } catch (error) {
    // If anything goes wrong, log the error and show user-friendly message
    console.error('Error:', error);
    document.getElementById('routineOutput').textContent = 'Sorry, there was an error generating your routine. Please try again.';
  } finally {
    // Always reset the button back to its original state using innerHTML to render the icon
    button.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate My Routine';
    button.disabled = false;
  }
});
