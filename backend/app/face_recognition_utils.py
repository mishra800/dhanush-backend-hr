"""
Face Recognition Utilities for Attendance System
Uses face_recognition library for face matching
"""
try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    print("WARNING: face_recognition library not installed. Face recognition features will be disabled.")
    print("To enable face recognition, run: pip install face-recognition opencv-python Pillow")

import numpy as np
import base64
from io import BytesIO
from PIL import Image
import os

def decode_base64_image(base64_string):
    """Decode base64 image string to PIL Image"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        image_data = base64.b64decode(base64_string)
        image = Image.open(BytesIO(image_data))
        return np.array(image)
    except Exception as e:
        print(f"Error decoding image: {e}")
        return None

def get_face_encoding(image_array):
    """Extract face encoding from image array"""
    if not FACE_RECOGNITION_AVAILABLE:
        return None, "Face recognition library not installed. Please install: pip install face-recognition"
    
    try:
        # Find all face locations in the image
        face_locations = face_recognition.face_locations(image_array)
        
        if len(face_locations) == 0:
            return None, "No face detected in image"
        
        if len(face_locations) > 1:
            return None, "Multiple faces detected. Please ensure only one person is in frame"
        
        # Get face encoding
        face_encodings = face_recognition.face_encodings(image_array, face_locations)
        
        if len(face_encodings) > 0:
            return face_encodings[0], None
        else:
            return None, "Could not extract face features"
            
    except Exception as e:
        return None, f"Error processing face: {str(e)}"

def detect_image_quality(image_array):
    """
    Analyze image quality for face recognition
    Returns quality metrics and recommendations
    """
    try:
        import cv2
        
        # Convert to grayscale for analysis
        if len(image_array.shape) == 3:
            gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = image_array
        
        # Calculate image quality metrics
        height, width = gray.shape
        
        # Brightness analysis
        brightness = np.mean(gray)
        
        # Contrast analysis (standard deviation)
        contrast = np.std(gray)
        
        # Blur detection using Laplacian variance
        blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Image size check
        min_size = 200
        size_adequate = min(height, width) >= min_size
        
        # Quality assessment
        quality_issues = []
        quality_score = 100
        
        if brightness < 50:
            quality_issues.append("Image too dark")
            quality_score -= 20
        elif brightness > 200:
            quality_issues.append("Image too bright")
            quality_score -= 15
        
        if contrast < 30:
            quality_issues.append("Low contrast")
            quality_score -= 15
        
        if blur_score < 100:
            quality_issues.append("Image appears blurry")
            quality_score -= 25
        
        if not size_adequate:
            quality_issues.append(f"Image too small (minimum {min_size}x{min_size})")
            quality_score -= 30
        
        return {
            "quality_score": max(0, quality_score),
            "brightness": round(brightness, 2),
            "contrast": round(contrast, 2),
            "blur_score": round(blur_score, 2),
            "size": f"{width}x{height}",
            "issues": quality_issues,
            "acceptable": quality_score >= 60
        }
        
    except Exception as e:
        return {
            "quality_score": 50,
            "issues": [f"Quality analysis failed: {str(e)}"],
            "acceptable": True  # Default to acceptable if analysis fails
        }

def detect_liveness_indicators(image_array):
    """
    Basic liveness detection to prevent photo spoofing
    Returns indicators that suggest a live person vs photo
    """
    try:
        import cv2
        
        # Convert to grayscale
        if len(image_array.shape) == 3:
            gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = image_array
        
        liveness_indicators = {
            "texture_analysis": 0,
            "edge_density": 0,
            "color_distribution": 0,
            "overall_score": 0,
            "is_likely_live": True,
            "warnings": []
        }
        
        # Texture analysis - live faces have more natural texture variation
        texture_score = cv2.Laplacian(gray, cv2.CV_64F).var()
        liveness_indicators["texture_analysis"] = min(100, texture_score / 10)
        
        # Edge density analysis
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])
        liveness_indicators["edge_density"] = min(100, edge_density * 1000)
        
        # Color distribution analysis (if color image)
        if len(image_array.shape) == 3:
            color_std = np.std(image_array, axis=(0, 1))
            color_variation = np.mean(color_std)
            liveness_indicators["color_distribution"] = min(100, color_variation * 2)
        else:
            liveness_indicators["color_distribution"] = 50
        
        # Calculate overall liveness score
        overall_score = (
            liveness_indicators["texture_analysis"] * 0.4 +
            liveness_indicators["edge_density"] * 0.3 +
            liveness_indicators["color_distribution"] * 0.3
        )
        liveness_indicators["overall_score"] = round(overall_score, 2)
        
        # Determine if likely live
        if overall_score < 30:
            liveness_indicators["is_likely_live"] = False
            liveness_indicators["warnings"].append("Low texture variation - possible photo")
        
        if liveness_indicators["edge_density"] < 20:
            liveness_indicators["warnings"].append("Unusual edge patterns detected")
        
        return liveness_indicators
        
    except Exception as e:
        return {
            "texture_analysis": 50,
            "edge_density": 50,
            "color_distribution": 50,
            "overall_score": 50,
            "is_likely_live": True,
            "warnings": [f"Liveness analysis failed: {str(e)}"]
        }

def compare_faces(profile_image_base64, attendance_image_base64, tolerance=0.6):
    """
    Compare two face images and return match result with enhanced security
    
    Args:
        profile_image_base64: Base64 encoded profile image
        attendance_image_base64: Base64 encoded attendance image
        tolerance: Face matching tolerance (lower = stricter, default 0.6)
    
    Returns:
        dict with match result and security analysis
    """
    if not FACE_RECOGNITION_AVAILABLE:
        return {
            "match": False,
            "confidence": 0,
            "message": "Face recognition library not installed. Please install: pip install face-recognition opencv-python Pillow",
            "security_analysis": {
                "quality_check": {"acceptable": False},
                "liveness_check": {"is_likely_live": False}
            }
        }
    
    try:
        # Decode images
        profile_image = decode_base64_image(profile_image_base64)
        attendance_image = decode_base64_image(attendance_image_base64)
        
        if profile_image is None:
            return {
                "match": False,
                "confidence": 0,
                "message": "Failed to decode profile image",
                "security_analysis": {
                    "quality_check": {"acceptable": False},
                    "liveness_check": {"is_likely_live": False}
                }
            }
        
        if attendance_image is None:
            return {
                "match": False,
                "confidence": 0,
                "message": "Failed to decode attendance image",
                "security_analysis": {
                    "quality_check": {"acceptable": False},
                    "liveness_check": {"is_likely_live": False}
                }
            }
        
        # Perform security analysis on attendance image
        quality_analysis = detect_image_quality(attendance_image)
        liveness_analysis = detect_liveness_indicators(attendance_image)
        
        # Check if image quality is acceptable
        if not quality_analysis["acceptable"]:
            return {
                "match": False,
                "confidence": 0,
                "message": f"Image quality too low: {', '.join(quality_analysis['issues'])}",
                "security_analysis": {
                    "quality_check": quality_analysis,
                    "liveness_check": liveness_analysis
                }
            }
        
        # Check liveness indicators
        security_warnings = []
        if not liveness_analysis["is_likely_live"]:
            security_warnings.append("Possible photo spoofing detected")
        
        if liveness_analysis["warnings"]:
            security_warnings.extend(liveness_analysis["warnings"])
        
        # Get face encodings
        profile_encoding, profile_error = get_face_encoding(profile_image)
        if profile_error:
            return {
                "match": False,
                "confidence": 0,
                "message": f"Profile image error: {profile_error}",
                "security_analysis": {
                    "quality_check": quality_analysis,
                    "liveness_check": liveness_analysis
                }
            }
        
        attendance_encoding, attendance_error = get_face_encoding(attendance_image)
        if attendance_error:
            return {
                "match": False,
                "confidence": 0,
                "message": f"Attendance image error: {attendance_error}",
                "security_analysis": {
                    "quality_check": quality_analysis,
                    "liveness_check": liveness_analysis
                }
            }
        
        # Compare faces
        face_distance = face_recognition.face_distance([profile_encoding], attendance_encoding)[0]
        match = face_distance <= tolerance
        
        # Calculate confidence percentage (inverse of distance)
        confidence = max(0, min(100, (1 - face_distance) * 100))
        
        # Adjust confidence based on security analysis
        security_confidence_modifier = 1.0
        
        if liveness_analysis["overall_score"] < 50:
            security_confidence_modifier *= 0.8  # Reduce confidence for low liveness score
        
        if quality_analysis["quality_score"] < 80:
            security_confidence_modifier *= 0.9  # Reduce confidence for low quality
        
        adjusted_confidence = confidence * security_confidence_modifier
        
        # Final security check - reject if too many warnings
        if len(security_warnings) >= 2 and adjusted_confidence < 85:
            match = False
            security_warnings.append("Multiple security concerns detected")
        
        result_message = "Face matched successfully"
        if match and security_warnings:
            result_message += f" (Security warnings: {len(security_warnings)})"
        elif not match:
            result_message = "Face does not match profile"
        
        return {
            "match": match,
            "confidence": round(adjusted_confidence, 2),
            "raw_confidence": round(confidence, 2),
            "message": result_message,
            "face_distance": round(face_distance, 4),
            "security_analysis": {
                "quality_check": quality_analysis,
                "liveness_check": liveness_analysis,
                "security_warnings": security_warnings,
                "confidence_modifier": round(security_confidence_modifier, 3)
            }
        }
        
    except Exception as e:
        return {
            "match": False,
            "confidence": 0,
            "message": f"Face recognition error: {str(e)}",
            "security_analysis": {
                "quality_check": {"acceptable": False},
                "liveness_check": {"is_likely_live": False},
                "security_warnings": [f"Analysis failed: {str(e)}"]
            }
        }

def save_profile_image(employee_id, image_base64):
    """Save employee profile image for future face matching"""
    try:
        upload_dir = "uploads/profile_images"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Decode and save image
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        image_data = base64.b64decode(image_base64)
        file_path = os.path.join(upload_dir, f"employee_{employee_id}.jpg")
        
        with open(file_path, 'wb') as f:
            f.write(image_data)
        
        return file_path
    except Exception as e:
        print(f"Error saving profile image: {e}")
        return None

def load_profile_image(employee_id):
    """Load employee profile image as base64"""
    try:
        file_path = f"uploads/profile_images/employee_{employee_id}.jpg"
        
        if not os.path.exists(file_path):
            return None
        
        with open(file_path, 'rb') as f:
            image_data = f.read()
            return base64.b64encode(image_data).decode('utf-8')
    except Exception as e:
        print(f"Error loading profile image: {e}")
        return None

async def verify_face(employee_id, attendance_image_base64, tolerance=0.6):
    """
    Verify face against stored profile image
    
    Args:
        employee_id: Employee ID to verify against
        attendance_image_base64: Base64 encoded attendance image
        tolerance: Face matching tolerance (lower = stricter, default 0.6)
    
    Returns:
        dict with verification result
    """
    if not FACE_RECOGNITION_AVAILABLE:
        return {
            "success": False,
            "error": "face_recognition_unavailable",
            "message": "Face recognition library not installed",
            "confidence": 0
        }
    
    try:
        # Load profile image
        profile_image_base64 = load_profile_image(employee_id)
        
        if not profile_image_base64:
            return {
                "success": False,
                "error": "no_profile_image",
                "message": "No profile image found for employee",
                "confidence": 0
            }
        
        # Compare faces
        result = compare_faces(profile_image_base64, attendance_image_base64, tolerance)
        
        if result["match"]:
            return {
                "success": True,
                "message": "Face verification successful",
                "confidence": result["confidence"],
                "face_distance": result.get("face_distance", 0),
                "security_analysis": result.get("security_analysis", {})
            }
        else:
            return {
                "success": False,
                "error": "face_mismatch",
                "message": result["message"],
                "confidence": result["confidence"],
                "face_distance": result.get("face_distance", 1),
                "security_analysis": result.get("security_analysis", {})
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": "verification_failed",
            "message": f"Face verification failed: {str(e)}",
            "confidence": 0
        }

def validate_profile_image(image_base64):
    """
    Validate profile image quality and suitability for face recognition
    
    Args:
        image_base64: Base64 encoded image
    
    Returns:
        dict with validation result and recommendations
    """
    if not FACE_RECOGNITION_AVAILABLE:
        return {
            "valid": False,
            "message": "Face recognition library not installed",
            "recommendations": ["Install face recognition dependencies"]
        }
    
    try:
        # Decode image
        image_array = decode_base64_image(image_base64)
        if image_array is None:
            return {
                "valid": False,
                "message": "Failed to decode image",
                "recommendations": ["Use a valid image format (JPEG, PNG)"]
            }
        
        # Check image quality
        quality_analysis = detect_image_quality(image_array)
        
        # Check for face detection
        face_encoding, face_error = get_face_encoding(image_array)
        
        recommendations = []
        issues = []
        
        # Quality checks
        if not quality_analysis["acceptable"]:
            issues.extend(quality_analysis["issues"])
            
            if quality_analysis["brightness"] < 50:
                recommendations.append("Take photo in better lighting")
            elif quality_analysis["brightness"] > 200:
                recommendations.append("Reduce lighting or avoid direct flash")
            
            if quality_analysis["blur_score"] < 100:
                recommendations.append("Hold camera steady and ensure focus")
            
            if quality_analysis["contrast"] < 30:
                recommendations.append("Improve lighting contrast")
        
        # Face detection checks
        if face_error:
            issues.append(face_error)
            
            if "No face detected" in face_error:
                recommendations.append("Ensure your face is clearly visible and centered")
            elif "Multiple faces" in face_error:
                recommendations.append("Ensure only one person is in the photo")
            else:
                recommendations.append("Retake photo with better face positioning")
        
        # Overall validation
        is_valid = len(issues) == 0 and quality_analysis["acceptable"] and face_encoding is not None
        
        if is_valid:
            message = "Profile image is suitable for face recognition"
        else:
            message = f"Image validation failed: {', '.join(issues)}"
        
        return {
            "valid": is_valid,
            "message": message,
            "quality_score": quality_analysis["quality_score"],
            "face_detected": face_encoding is not None,
            "issues": issues,
            "recommendations": recommendations,
            "quality_details": quality_analysis
        }
        
    except Exception as e:
        return {
            "valid": False,
            "message": f"Validation error: {str(e)}",
            "recommendations": ["Try uploading the image again"]
        }
