import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from sklearn.preprocessing import StandardScaler


class SpecialtyPredictor:
    """
    Specialty recommendation system based on student grades.
    Implements the same methodology as SystemeRecommandationSpecialites from the notebook.
    """
    
    def __init__(self):
        # Define specialties and their associated modules
        self.specialties = {
            'SIQ': ['RES1', 'SYS1', 'SYS2', 'RES2', 'SEC'],        # Systèmes & Réseaux
            'SID': ['ANUM', 'RO', 'THP', 'ARCH'],                   # Mathématiques & Algorithmes / Architecture
            'SIT': ['ORG', 'CPROJ', 'PROJ', 'MCSI'],                # Management & Projets IT
            'SIL': ['IGL', 'BDD']                                    # Génie Logiciel
        }
        
        self.specialty_descriptions = {
            'SIL': 'Génie Logiciel',
            'SIQ': 'Systèmes & Réseaux',
            'SID': 'Mathématiques & Algorithmes / Architecture',
            'SIT': 'Management & Projets IT'
        }
        
        # Scaler for normalization
        self.scaler: Optional[StandardScaler] = None
        self.modules_disponibles: List[str] = []
        self.is_trained = False
    
    def train(self, training_data: pd.DataFrame) -> None:
        """
        Train the predictor on historical student data for normalization.
        
        Args:
            training_data: DataFrame with student grades (columns should include module names)
        """
        # Identify available modules
        all_modules = []
        for modules in self.specialties.values():
            all_modules.extend(modules)
        
        self.modules_disponibles = [m for m in all_modules if m in training_data.columns]
        
        if not self.modules_disponibles:
            raise ValueError("No required modules found in training data")
        
        # Initialize and fit the scaler
        self.scaler = StandardScaler()
        self.scaler.fit(training_data[self.modules_disponibles])
        self.is_trained = True
    
    def predict_single(self, student_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict specialty for a single student based on their grades.
        
        Args:
            student_data: Dictionary containing student grades for various modules
        
        Returns:
            Dictionary with recommended_specialty, confidence_score, profile, and explanation
        """
        if not self.is_trained:
            # Auto-train with the student's data if not trained
            # This is a fallback - ideally train() should be called explicitly
            return self._predict_without_training(student_data)
        
        # Extract grades for available modules
        grades = {}
        for module in self.modules_disponibles:
            if module in student_data and student_data[module] is not None:
                try:
                    grades[module] = float(student_data[module])
                except (ValueError, TypeError):
                    continue
        
        # Check if we have enough data
        missing_modules = [m for m in self.modules_disponibles if m not in grades]
        if len(grades) < len(self.modules_disponibles) * 0.5:  # At least 50% of modules
            return {
                'recommended_specialty': None,
                'confidence_score': 0.0,
                'profile': {},
                'explanation': f"Insufficient data: missing modules {missing_modules}"
            }
        
        # Create DataFrame for normalization
        student_df = pd.DataFrame([grades])
        
        # Normalize grades using the trained scaler
        # Only normalize modules that are present
        modules_to_normalize = [m for m in self.modules_disponibles if m in grades]
        normalized_grades = self.scaler.transform(student_df[modules_to_normalize])[0]
        normalized_dict = dict(zip(modules_to_normalize, normalized_grades))
        
        # Calculate scores for each specialty
        scores = {}
        for specialty, modules in self.specialties.items():
            specialty_modules = [m for m in modules if m in normalized_dict]
            if specialty_modules:
                scores[specialty] = np.mean([normalized_dict[m] for m in specialty_modules])
        
        if not scores:
            return {
                'recommended_specialty': None,
                'confidence_score': 0.0,
                'profile': {},
                'explanation': "Could not calculate scores for any specialty"
            }
        
        # Apply softmax to transform scores into probabilities (avoids negative values)
        scores_array = np.array(list(scores.values()))
        scores_array_shifted = scores_array - np.max(scores_array)
        exp_scores = np.exp(scores_array_shifted)
        profile_values = exp_scores / np.sum(exp_scores)
        
        # Create the final profile
        profile = dict(zip(scores.keys(), profile_values))
        
        # Find recommended specialty (highest score)
        recommended_specialty = max(scores.keys(), key=lambda x: scores[x])
        confidence = float(profile[recommended_specialty])
        
        # Generate explanation based on strongest modules
        specialty_modules = [m for m in self.specialties[recommended_specialty] if m in grades]
        if specialty_modules:
            module_grades = [(m, grades[m]) for m in specialty_modules]
            module_grades.sort(key=lambda x: x[1], reverse=True)
            top_modules = module_grades[:2]
            
            explanation = (
                f"Student excels in {', '.join([m[0] for m in top_modules])} "
                f"(grades: {', '.join([f'{m[1]:.1f}' for m in top_modules])}), "
                f"which align well with {recommended_specialty} - {self.specialty_descriptions[recommended_specialty]}."
            )
        else:
            explanation = f"Recommendation based on overall score analysis for {recommended_specialty}."
        
        return {
            'recommended_specialty': recommended_specialty,
            'confidence_score': round(confidence, 3),
            'profile': {k: round(v, 3) for k, v in profile.items()},
            'scores': {k: round(v, 3) for k, v in scores.items()},
            'explanation': explanation
        }
    
    def _predict_without_training(self, student_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fallback prediction method when scaler is not trained.
        Uses raw grades without normalization.
        """
        # Extract grades
        grades = {}
        all_modules = []
        for modules in self.specialties.values():
            all_modules.extend(modules)
        
        for module in all_modules:
            if module in student_data and student_data[module] is not None:
                try:
                    grades[module] = float(student_data[module])
                except (ValueError, TypeError):
                    continue
        
        if not grades:
            return {
                'recommended_specialty': None,
                'confidence_score': 0.0,
                'profile': {},
                'explanation': "No valid grade data provided"
            }
        
        # Calculate average scores for each specialty (without normalization)
        scores = {}
        for specialty, modules in self.specialties.items():
            specialty_modules = [m for m in modules if m in grades]
            if specialty_modules:
                scores[specialty] = np.mean([grades[m] for m in specialty_modules])
        
        if not scores:
            return {
                'recommended_specialty': None,
                'confidence_score': 0.0,
                'profile': {},
                'explanation': "Could not calculate scores for any specialty"
            }
        
        # Normalize scores to create profile
        total_score = sum(scores.values())
        profile = {k: v / total_score for k, v in scores.items()}
        
        recommended_specialty = max(scores.keys(), key=lambda x: scores[x])
        confidence = float(profile[recommended_specialty])
        
        # Generate explanation
        specialty_modules = [m for m in self.specialties[recommended_specialty] if m in grades]
        if specialty_modules:
            module_grades = [(m, grades[m]) for m in specialty_modules]
            module_grades.sort(key=lambda x: x[1], reverse=True)
            top_modules = module_grades[:2]
            
            explanation = (
                f"Student excels in {', '.join([m[0] for m in top_modules])} "
                f"(grades: {', '.join([f'{m[1]:.1f}' for m in top_modules])}), "
                f"which align well with {recommended_specialty} - {self.specialty_descriptions[recommended_specialty]}."
            )
        else:
            explanation = f"Recommendation based on overall score analysis for {recommended_specialty}."
        
        return {
            'recommended_specialty': recommended_specialty,
            'confidence_score': round(confidence, 3),
            'profile': {k: round(v, 3) for k, v in profile.items()},
            'scores': {k: round(v, 3) for k, v in scores.items()},
            'explanation': explanation
        }


# Global predictor instance
predictor = SpecialtyPredictor()


def predict_specialties(students_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Predict specialties for a list of students based on their grades.
    
    Args:
        students_data: List of dictionaries containing student information and grades
    
    Returns:
        List of dictionaries with predictions added to student data
    """
    results = []
    
    for student_data in students_data:
        # Get prediction
        prediction = predictor.predict_single(student_data)
        
        # Add prediction to student data
        student_result = student_data.copy()
        student_result.update(prediction)
        results.append(student_result)
    
    return results