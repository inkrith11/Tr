import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { getConversations, getConversationMessages, sendMessage } from '../services/messageService';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { FaUserCircle, FaPaperPlane, FaArrowLeft } from 'react-icons/fa';
import { format, isToday, isYesterday } from 'date-fns';

const Messages = () => {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get('listing');
  const { user } = useAuth();
  
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (userId) {
      fetchMessages(userId);
      // Poll for new messages every 3 seconds
      pollIntervalRef.current = setInterval(() => {
        fetchMessages(userId, true);
      }, 3000);
    }
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const { data } = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (recipientId, silent = false) => {
    try {
      const { data } = await getConversationMessages(recipientId);
      setMessages(data.messages || []);
      if (data.other_user) {
        setSelectedConversation(data.other_user);
      }
    } catch (error) {
      if (!silent) console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !userId) return;

    setSending(true);
    try {
      await sendMessage({
        receiver_id: parseInt(userId),
        content: messageText.trim(),
        listing_id: listingId ? parseInt(listingId) : null
      });
      setMessageText('');
      fetchMessages(userId);
      fetchConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday ' + format(date, 'h:mm a');
    }
    return format(date, 'MMM d, h:mm a');
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="flex h-full">
          {/* Conversations List */}
          <div className={`w-full md:w-1/3 border-r border-gray-200 ${userId ? 'hidden md:block' : ''}`}>
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            </div>
            <div className="overflow-y-auto h-[calc(100%-60px)]">
              {conversations.length > 0 ? (
                conversations.map(conv => (
                  <Link
                    key={conv.user.id}
                    to={`/messages/${conv.user.id}`}
                    className={`flex items-center p-4 hover:bg-gray-50 border-b border-gray-100 ${
                      parseInt(userId) === conv.user.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    {conv.user.profile_picture ? (
                      <img 
                        src={conv.user.profile_picture} 
                        alt={conv.user.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <FaUserCircle className="h-12 w-12 text-gray-400" />
                    )}
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 truncate">{conv.user.name}</p>
                        <p className="text-xs text-gray-400">
                          {conv.last_message?.created_at && formatMessageTime(conv.last_message.created_at)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conv.last_message?.content || 'No messages yet'}
                      </p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="ml-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </Link>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No conversations yet</p>
                  <p className="text-sm mt-2">Contact sellers to start messaging</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className={`flex-1 flex flex-col ${!userId ? 'hidden md:flex' : ''}`}>
            {userId ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center">
                  <Link 
                    to="/messages" 
                    className="md:hidden mr-3 text-gray-600 hover:text-gray-900"
                    aria-label="Back to conversations"
                  >
                    <FaArrowLeft aria-hidden="true" />
                  </Link>
                  {selectedConversation?.profile_picture ? (
                    <img 
                      src={selectedConversation.profile_picture} 
                      alt={selectedConversation.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <FaUserCircle className="h-10 w-10 text-gray-400" />
                  )}
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{selectedConversation?.name || 'Loading...'}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, index) => {
                    const isOwn = msg.sender_id === user.id;
                    return (
                      <div
                        key={msg.id || index}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isOwn
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                            {msg.created_at && formatMessageTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      aria-label="Type a message"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    />
                    <button
                      type="submit"
                      disabled={sending || !messageText.trim()}
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 transition-colors"
                      aria-label="Send message"
                    >
                      <FaPaperPlane aria-hidden="true" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
