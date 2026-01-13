const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class AIAssistantService {
  constructor() {
    this.isTyping = false;
    this.messageQueue = [];
    this.contextHistory = [];
    this.userPreferences = this.loadUserPreferences();
    this.analytics = {
      sessionStart: new Date(),
      interactionCount: 0,
      intents: {}
    };
  }

  loadUserPreferences() {
    try {
      const prefs = localStorage.getItem('ai_assistant_preferences');
      return prefs ? JSON.parse(prefs) : {
        responseSpeed: 'normal',
        detailedResponses: true,
        showSuggestions: true,
        enableAnalytics: true
      };
    } catch {
      return {
        responseSpeed: 'normal',
        detailedResponses: true,
        showSuggestions: true,
        enableAnalytics: true
      };
    }
  }

  saveUserPreferences(preferences) {
    this.userPreferences = { ...this.userPreferences, ...preferences };
    localStorage.setItem('ai_assistant_preferences', JSON.stringify(this.userPreferences));
  }

  async sendMessage(message, context = {}) {
    try {
      const token = localStorage.getItem('token');
      
      // Track analytics
      this.analytics.interactionCount++;
      
      // Add enhanced context
      const enrichedMessage = {
        message,
        context: {
          ...context,
          timestamp: new Date().toISOString(),
          page: window.location.pathname,
          userAgent: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
          sessionId: this.getSessionId(),
          preferences: this.userPreferences
        },
        history: this.contextHistory.slice(-5) // Last 5 messages for context
      };

      const response = await fetch(`${API_BASE_URL}/ai-assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(enrichedMessage)
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      
      // Track intent analytics
      if (result.intent) {
        this.analytics.intents[result.intent] = (this.analytics.intents[result.intent] || 0) + 1;
      }
      
      // Update context history
      this.contextHistory.push({
        user: message,
        assistant: result.response,
        intent: result.intent,
        confidence: result.confidence,
        timestamp: new Date().toISOString()
      });

      // Keep only last 10 exchanges
      if (this.contextHistory.length > 10) {
        this.contextHistory = this.contextHistory.slice(-10);
      }

      return {
        ...result,
        sessionAnalytics: this.getSessionAnalytics()
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return this.getIntelligentFallback(message, context);
    }
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('ai_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('ai_session_id', sessionId);
    }
    return sessionId;
  }

  getSessionAnalytics() {
    const sessionDuration = (new Date() - this.analytics.sessionStart) / 1000 / 60; // minutes
    return {
      sessionDuration: Math.round(sessionDuration * 10) / 10,
      interactionCount: this.analytics.interactionCount,
      topIntents: Object.entries(this.analytics.intents)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([intent, count]) => ({ intent, count }))
    };
  }

  async getSuggestions(context = {}) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/ai-assistant/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          context: {
            ...context,
            page: window.location.pathname,
            timestamp: new Date().toISOString(),
            preferences: this.userPreferences
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return { suggestions: this.getContextualSuggestions(context) };
    }
  }

  async getCapabilities() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/ai-assistant/capabilities`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get capabilities');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting capabilities:', error);
      return { capabilities: [], features: [] };
    }
  }

  async submitFeedback(rating, comment, messageId = null) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/ai-assistant/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating,
          comment,
          messageId,
          timestamp: new Date().toISOString(),
          sessionId: this.getSessionId()
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return false;
    }
  }

  // Enhanced contextual suggestions with smart recommendations
  getContextualSuggestions(context = {}) {
    const { currentPhase, page } = context;
    
    // Page-specific suggestions
    if (page) {
      if (page.includes('/leave')) {
        return [
          "What's my leave balance?",
          "How to apply for leave?",
          "Leave policy details",
          "Pending leave requests"
        ];
      } else if (page.includes('/attendance')) {
        return [
          "Today's attendance status",
          "Mark attendance now",
          "Weekly attendance summary",
          "WFH request process"
        ];
      } else if (page.includes('/payroll')) {
        return [
          "Latest salary details",
          "Tax breakdown",
          "PF information",
          "Payroll history"
        ];
      } else if (page.includes('/performance')) {
        return [
          "My performance rating",
          "Goal progress",
          "Set new goals",
          "Performance feedback"
        ];
      } else if (page.includes('/learning')) {
        return [
          "Course progress",
          "Available courses",
          "Learning recommendations",
          "Skill assessment"
        ];
      }
    }
    
    // Onboarding phase-specific suggestions
    if (currentPhase === 1) {
      return [
        "What documents do I need?",
        "When is my first day?",
        "Who is my onboarding buddy?",
        "Pre-boarding checklist"
      ];
    } else if (currentPhase === 2) {
      return [
        "First day schedule",
        "Where do I report?",
        "What should I bring?",
        "Building access info"
      ];
    } else if (currentPhase === 3) {
      return [
        "IT setup status",
        "Employee form help",
        "Document verification",
        "Laptop delivery timeline"
      ];
    } else if (currentPhase === 4) {
      return [
        "Training modules list",
        "Training schedule",
        "Remote training options",
        "Training completion status"
      ];
    } else if (currentPhase === 5) {
      return [
        "Activation timeline",
        "Pending requirements",
        "Status check",
        "Approval process"
      ];
    } else if (currentPhase === 6) {
      return [
        "Performance goals",
        "30-day feedback",
        "Support resources",
        "Career guidance"
      ];
    }
    
    // Default suggestions
    return [
      "How can you help me?",
      "What's my current status?",
      "What do I need to do next?",
      "Show my information"
    ];
  }

  // Enhanced intelligent fallback with better context understanding
  getIntelligentFallback(message, context = {}) {
    const lowerMessage = message.toLowerCase();
    const { currentPhase, page } = context;
    
    // Intent-based fallback responses
    if (this.containsKeywords(lowerMessage, ['leave', 'vacation', 'time off', 'pto'])) {
      return {
        response: "I can help you with leave-related queries! I can check your leave balance, explain the application process, show pending requests, and provide policy information. What specific leave information do you need?",
        data: { intent: 'leave_help', type: 'fallback' },
        suggestions: ["Check leave balance", "Apply for leave", "Leave policy", "Pending requests"],
        confidence: 0.8
      };
    }
    
    if (this.containsKeywords(lowerMessage, ['attendance', 'check in', 'check out', 'present'])) {
      return {
        response: "I can assist with attendance-related questions! I can show today's attendance, help with marking attendance, provide attendance history, and explain WFH policies. What attendance information would you like?",
        data: { intent: 'attendance_help', type: 'fallback' },
        suggestions: ["Today's attendance", "Mark attendance", "Attendance history", "WFH request"],
        confidence: 0.8
      };
    }
    
    if (this.containsKeywords(lowerMessage, ['salary', 'payroll', 'pay', 'tax', 'pf'])) {
      return {
        response: "I can help with payroll and salary information! I can show your latest payslip, explain tax deductions, provide PF details, and display salary history. What payroll information do you need?",
        data: { intent: 'payroll_help', type: 'fallback' },
        suggestions: ["Latest payslip", "Tax details", "PF information", "Salary history"],
        confidence: 0.8
      };
    }
    
    // Phase-specific fallback
    if (currentPhase) {
      const phaseGuidance = this.getPhaseGuidance(currentPhase);
      return {
        response: `You're in Phase ${currentPhase} of onboarding. ${phaseGuidance} I can provide specific guidance for your current phase. What would you like to know?`,
        data: { phase: currentPhase, type: 'phase_guidance' },
        suggestions: this.getContextualSuggestions(context),
        confidence: 0.7
      };
    }
    
    // General help fallback
    return {
      response: "I'm your AI HR Assistant! I can help with leave management, attendance tracking, payroll information, performance goals, learning courses, and much more. I understand natural language, so feel free to ask me anything about your work life. What would you like to know?",
      data: { type: 'general_help' },
      suggestions: this.getContextualSuggestions(context),
      confidence: 0.6
    };
  }

  containsKeywords(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
  }

  getPhaseGuidance(phase) {
    const guidance = {
      1: "Focus on preparing your documents and familiarizing yourself with company policies.",
      2: "Your first day is about meeting your team and getting oriented with the workplace.",
      3: "Complete your employee form and document verification. IT setup will follow compliance approval.",
      4: "Work through the training modules at your own pace to build essential skills.",
      5: "Wait for HR approval once all requirements are met. You're almost ready!",
      6: "Focus on your goals and seek regular feedback to ensure a smooth transition."
    };
    
    return guidance[phase] || "Continue following the onboarding steps.";
  }

  // Enhanced response formatting with rich content and actions
  formatResponse(response) {
    if (!response || !response.response) {
      return "I'm sorry, I couldn't process your request right now. Please try again.";
    }

    let formattedResponse = response.response;

    // Add contextual action buttons and tips
    if (response.data) {
      // Add phase-specific tips
      if (response.data.phase === 3 && response.data.type === 'form') {
        formattedResponse += "\n\n💡 **Quick Tip**: Click 'Fill Form Now' in the Compliance section to get started immediately.";
      }
      
      if (response.data.intent === 'leave_balance' && response.data.total_balance) {
        if (response.data.total_balance > 10) {
          formattedResponse += "\n\n🌴 **Suggestion**: You have good leave balance. Consider planning a vacation!";
        } else if (response.data.total_balance < 5) {
          formattedResponse += "\n\n⚠️ **Note**: Your leave balance is running low. Plan carefully.";
        }
      }
      
      if (response.data.intent === 'attendance_today' && response.data.working_hours) {
        formattedResponse += `\n\n⏰ **Today's Progress**: ${response.data.working_hours} worked so far.`;
      }
      
      // Add navigation hints
      if (response.actions && response.actions.length > 0) {
        const primaryAction = response.actions[0];
        if (primaryAction.url) {
          formattedResponse += `\n\n🔗 **Quick Action**: ${primaryAction.label}`;
        }
      }
    }

    return formattedResponse;
  }

  // Enhanced quick replies with smart categorization
  getQuickReplies(response, context = {}) {
    if (response && response.suggestions) {
      return response.suggestions;
    }

    // Smart suggestions based on response content and context
    const suggestions = [];
    
    if (response && response.data) {
      const { intent } = response.data;
      
      // Intent-specific suggestions
      if (intent === 'leave_balance') {
        suggestions.push("Apply for leave", "Leave policy", "Leave history");
      } else if (intent === 'attendance_today') {
        suggestions.push("Weekly summary", "Mark attendance", "Attendance rules");
      } else if (intent === 'payroll_current') {
        suggestions.push("Tax breakdown", "PF details", "Download payslip");
      } else if (intent === 'performance_review') {
        suggestions.push("Set goals", "Request feedback", "Performance tips");
      } else if (intent === 'learning_progress') {
        suggestions.push("Browse courses", "Continue learning", "Skill assessment");
      }
      
      // Add contextual suggestions if we don't have enough
      if (suggestions.length < 3) {
        suggestions.push(...this.getContextualSuggestions(context));
      }
    }

    // Ensure we have at least some suggestions
    if (suggestions.length === 0) {
      return this.getContextualSuggestions(context);
    }

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }

  // Enhanced typing simulation with variable speed
  async simulateTyping(callback, customDelay = null) {
    this.isTyping = true;
    if (callback) callback(true);
    
    // Variable delay based on user preferences
    let delay = 1000; // default
    if (this.userPreferences.responseSpeed === 'fast') {
      delay = 500;
    } else if (this.userPreferences.responseSpeed === 'slow') {
      delay = 1500;
    }
    
    if (customDelay !== null) {
      delay = customDelay;
    }
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    this.isTyping = false;
    if (callback) callback(false);
  }

  // Smart message preprocessing with context enhancement
  preprocessMessage(message, context = {}) {
    let processedMessage = message.trim();
    
    // Add context hints for better AI understanding
    const contextHints = [];
    
    if (context.currentPhase) {
      contextHints.push(`[Onboarding Phase ${context.currentPhase}]`);
    }
    
    if (context.employeeStatus) {
      contextHints.push(`[Status: ${context.employeeStatus}]`);
    }
    
    if (context.page) {
      const pageContext = context.page.split('/').pop();
      if (pageContext) {
        contextHints.push(`[Page: ${pageContext}]`);
      }
    }
    
    if (contextHints.length > 0) {
      processedMessage = `${contextHints.join(' ')} ${processedMessage}`;
    }
    
    return processedMessage;
  }

  // Enhanced message sending with comprehensive features
  async sendMessageWithTyping(message, context = {}, onTypingChange = null) {
    // Preprocess message with context
    const processedMessage = this.preprocessMessage(message, context);
    
    // Simulate typing based on user preferences
    if (this.userPreferences.responseSpeed !== 'instant') {
      await this.simulateTyping(onTypingChange);
    }
    
    // Send message
    const response = await this.sendMessage(processedMessage, context);
    
    // Enhance response with suggestions and formatting
    return {
      ...response,
      response: this.formatResponse(response),
      suggestions: this.getQuickReplies(response, context),
      sessionAnalytics: this.getSessionAnalytics()
    };
  }

  // Check if message needs real-time data
  needsRealTimeData(message) {
    const realTimeKeywords = [
      'balance', 'salary', 'attendance', 'today', 'current', 'latest', 
      'recent', 'status', 'my', 'how many', 'show', 'what is', 'pending'
    ];
    
    return realTimeKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  // Get conversation summary for analytics
  getConversationSummary() {
    return {
      totalMessages: this.contextHistory.length,
      sessionDuration: this.getSessionAnalytics().sessionDuration,
      topIntents: this.getSessionAnalytics().topIntents,
      lastInteraction: this.contextHistory.length > 0 ? 
        this.contextHistory[this.contextHistory.length - 1].timestamp : null
    };
  }

  // Clear conversation history
  clearHistory() {
    this.contextHistory = [];
    this.analytics = {
      sessionStart: new Date(),
      interactionCount: 0,
      intents: {}
    };
  }
}

export default new AIAssistantService();