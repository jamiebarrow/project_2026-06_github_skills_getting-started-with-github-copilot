"""
Tests for the High School Management System API

Uses pytest and TestClient to verify endpoint functionality.
All tests follow the Arrange-Act-Assert (AAA) pattern.
"""

import pytest
from copy import deepcopy
from fastapi.testclient import TestClient
from src.app import app, activities


@pytest.fixture
def client():
    """Provide a TestClient for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def reset_activities():
    """Fixture that resets the in-memory activities state between tests."""
    # Arrange: Save the original state before each test
    original_activities = deepcopy(activities)
    
    yield  # Act: Run the test
    
    # Assert: Restore the original state after each test
    activities.clear()
    activities.update(original_activities)


class TestGetActivities:
    """Tests for GET /activities endpoint."""
    
    def test_get_activities_returns_200(self, client):
        """
        Arrange: Prepare a test client
        Act: Make GET request to /activities
        Assert: Response status is 200 and contains expected activity names
        """
        # Arrange
        expected_names = {"Chess Club", "Programming Class", "Gym Class"}
        
        # Act
        response = client.get("/activities")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        assert all(name in data for name in expected_names)


class TestSignUp:
    """Tests for POST /activities/{name}/signup endpoint."""
    
    def test_signup_success(self, client, reset_activities):
        """
        Arrange: Prepare a valid activity and email
        Act: POST signup request
        Assert: Response is 200 and participant is added
        """
        # Arrange
        activity_name = "Swimming Team"
        email = "newstudent@mergington.edu"
        
        # Act
        response = client.post(
            f"/activities/{activity_name}/signup",
            params={"email": email}
        )
        
        # Assert
        assert response.status_code == 200
        assert email in activities[activity_name]["participants"]
        assert response.json()["message"] == f"Signed up {email} for {activity_name}"
    
    def test_signup_duplicate_email_returns_400(self, client, reset_activities):
        """
        Arrange: Prepare an activity and email already signed up
        Act: POST signup request with duplicate email
        Assert: Response is 400 with appropriate error message
        """
        # Arrange
        activity_name = "Chess Club"
        email = "michael@mergington.edu"  # Already in Chess Club
        
        # Act
        response = client.post(
            f"/activities/{activity_name}/signup",
            params={"email": email}
        )
        
        # Assert
        assert response.status_code == 400
        assert response.json()["detail"] == "Student already signed up for this activity"


class TestUnregister:
    """Tests for POST /activities/{name}/unregister endpoint."""
    
    def test_unregister_success(self, client, reset_activities):
        """
        Arrange: Prepare an activity with a participant to remove
        Act: POST unregister request
        Assert: Response is 200 and participant is removed
        """
        # Arrange
        activity_name = "Chess Club"
        email = "michael@mergington.edu"
        
        # Act
        response = client.post(
            f"/activities/{activity_name}/unregister",
            params={"email": email}
        )
        
        # Assert
        assert response.status_code == 200
        assert email not in activities[activity_name]["participants"]
        assert response.json()["message"] == f"Unregistered {email} from {activity_name}"
    
    def test_unregister_not_signed_up_returns_400(self, client, reset_activities):
        """
        Arrange: Prepare an activity and email not signed up
        Act: POST unregister request with non-existent participant
        Assert: Response is 400 with appropriate error message
        """
        # Arrange
        activity_name = "Drama Society"
        email = "nonexistent@mergington.edu"
        
        # Act
        response = client.post(
            f"/activities/{activity_name}/unregister",
            params={"email": email}
        )
        
        # Assert
        assert response.status_code == 400
        assert response.json()["detail"] == "Student not signed up for this activity"
