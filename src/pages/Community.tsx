import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType, collection, query, orderBy, getDocs, addDoc, doc, updateDoc, increment, deleteDoc, where, onSnapshot, setDoc, getDoc } from '../firebase';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Plus, 
  Image as ImageIcon, 
  Video, 
  Send,
  X,
  Smile,
  Zap,
  Flame,
  Award,
  Filter,
  CheckCircle2,
  Search,
  BarChart2,
  User,
  Calendar,
  Clock
} from 'lucide-react';
import { useAuth, cn } from '../App';
import { Post, Comment, User as UserType } from '../types';

const CATEGORIES = ['All', 'General', 'Nutrition', 'Fitness', 'Success Story', 'Announcement'] as const;
type Category = typeof CATEGORIES[number];

const REACTION_TYPES = [
  { id: 'like', icon: Heart, color: 'text-red-500', fill: 'fill-red-500', label: 'Like' },
  { id: 'strong', icon: Zap, color: 'text-yellow-500', fill: 'fill-yellow-500', label: 'Strong' },
  { id: 'fire', icon: Flame, color: 'text-orange-500', fill: 'fill-orange-500', label: 'Fire' },
  { id: 'award', icon: Award, color: 'text-purple-500', fill: 'fill-purple-500', label: 'Award' },
];

import { useCommunityPosts } from '../lib/queries';

export default function Community() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const { data: postsData, isLoading: loading } = useCommunityPosts(activeCategory);
  const posts = (postsData as Post[]) || [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({ 
    content: '', 
    imageUrl: '', 
    videoUrl: '', 
    category: 'General' as Post['category'] 
  });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPollMode, setIsPollMode] = useState(false);
  const [pollData, setPollData] = useState({
    question: '',
    options: ['', '']
  });
  const [viewingUser, setViewingUser] = useState<UserType | null>(null);

  const filteredPosts = posts.filter(post => {
    const searchLower = searchQuery.toLowerCase();
    return (
      post.content.toLowerCase().includes(searchLower) ||
      post.authorName.toLowerCase().includes(searchLower) ||
      post.category?.toLowerCase().includes(searchLower) ||
      post.poll?.question.toLowerCase().includes(searchLower)
    );
  });

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const postData: any = {
        ...newPost,
        authorId: user.id,
        authorName: user.fullName || 'Unknown',
        authorPhoto: user.photoUrl || '',
        likesCount: 0,
        commentsCount: 0,
        reactions: {},
        createdAt: new Date().toISOString()
      };

      if (isPollMode && pollData.question && pollData.options.some(opt => opt.trim())) {
        postData.poll = {
          question: pollData.question,
          options: pollData.options
            .filter(opt => opt.trim())
            .map((opt, index) => ({
              id: `opt-${index}`,
              text: opt,
              votes: []
            }))
        };
      }

      await addDoc(collection(db, 'announcements'), postData);
      setIsModalOpen(false);
      setNewPost({ content: '', imageUrl: '', videoUrl: '', category: 'General' });
      setPollData({ question: '', options: ['', ''] });
      setIsPollMode(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'announcements');
    }
  };

  const handleVote = async (postId: string, optionId: string) => {
    if (!user) return;
    try {
      const postRef = doc(db, 'announcements', postId);
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) return;

      const postData = postSnap.data() as Post;
      if (!postData.poll) return;

      const updatedOptions = postData.poll.options.map(opt => {
        // Remove user's vote from all options first (one vote per poll)
        const newVotes = opt.votes.filter(id => id !== user.id);
        // If this is the selected option, add user's vote
        if (opt.id === optionId) {
          newVotes.push(user.id);
        }
        return { ...opt, votes: newVotes };
      });

      await updateDoc(postRef, {
        'poll.options': updatedOptions
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `announcements/${postId}/poll`);
    }
  };

  const handleViewUser = async (userId: string) => {
    try {
      const userSnap = await getDoc(doc(db, 'users', userId));
      if (userSnap.exists()) {
        setViewingUser({ id: userSnap.id, ...userSnap.data() } as UserType);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${userId}`);
    }
  };

  const handleReaction = async (postId: string, reactionType: string) => {
    if (!user) return;
    try {
      const postRef = doc(db, 'announcements', postId);
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) return;

      const postData = postSnap.data() as Post;
      const reactions = postData.reactions || {};
      const userReactions = reactions[reactionType] || [];

      let updatedReactions;
      if (userReactions.includes(user.id)) {
        // Remove reaction
        updatedReactions = userReactions.filter(id => id !== user.id);
      } else {
        // Add reaction
        updatedReactions = [...userReactions, user.id];
      }

      await updateDoc(postRef, {
        [`reactions.${reactionType}`]: updatedReactions,
        // For backward compatibility with likesCount
        ...(reactionType === 'like' ? { 
          likesCount: updatedReactions.length 
        } : {})
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `announcements/${postId}`);
    }
  };

  const fetchComments = (postId: string) => {
    const q = query(collection(db, 'comments'), where('postId', '==', postId), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComments(data as any);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'comments');
    });
  };

  useEffect(() => {
    let unsubscribe: () => void;
    if (selectedPost) {
      unsubscribe = fetchComments(selectedPost.id);
    }
    return () => unsubscribe?.();
  }, [selectedPost]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !newComment.trim() || !user) return;
    try {
      await addDoc(collection(db, 'comments'), {
        postId: selectedPost.id,
        authorId: user.id,
        authorName: user.fullName || 'Unknown',
        authorPhoto: user.photoUrl || '',
        content: newComment,
        createdAt: new Date().toISOString()
      });

      await updateDoc(doc(db, 'announcements', selectedPost.id), {
        commentsCount: increment(1)
      });

      setNewComment('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'comments');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Helmet>
        <title>Community | JHC Health Guard</title>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [{
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://jhchealthguard.online/"
            },{
              "@type": "ListItem",
              "position": 2,
              "name": "Community",
              "item": "https://jhchealthguard.online/community"
            }]
          })}
        </script>
      </Helmet>
      {/* Header & Category Filter */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Community Feed</h1>
            <p className="text-slate-500 dark:text-slate-400">Share your health journey with others</p>
          </div>
          {user && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-600 transition-all active:scale-95"
            >
              <Plus size={24} />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search posts, authors, or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm dark:text-white"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all",
                activeCategory === cat 
                  ? "bg-blue-500 text-white shadow-md shadow-blue-100 dark:shadow-none" 
                  : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-6 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-slate-400 font-medium">Loading feed...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-12 text-center border border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Filter className="text-slate-300 dark:text-slate-600" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No posts found</h3>
            <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or category filter!</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <motion.div 
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group"
            >
              {/* Post Header */}
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleViewUser(post.authorId)}
                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-50 dark:border-slate-700 hover:ring-2 hover:ring-blue-500 transition-all"
                  >
                    <img src={post.authorPhoto || `https://ui-avatars.com/api/?name=${post.authorName}&background=3b82f6&color=fff`} alt="" className="w-full h-full object-cover" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleViewUser(post.authorId)}
                        className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-500 transition-colors"
                      >
                        {post.authorName}
                      </button>
                      {post.category && (
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                          {post.category}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(post.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                  <MoreHorizontal size={20} />
                </button>
              </div>

              {/* Post Content */}
              <div className="px-6 pb-4">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Poll Section */}
              {post.poll && (
                <div className="px-6 pb-6 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold mb-2">
                    <BarChart2 size={18} className="text-blue-500" />
                    <span>{post.poll.question}</span>
                  </div>
                  <div className="space-y-2">
                    {post.poll.options.map((option) => {
                      const totalVotes = post.poll?.options.reduce((acc, opt) => acc + opt.votes.length, 0) || 0;
                      const percentage = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
                      const hasVoted = option.votes.includes(user?.id || '');
                      
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleVote(post.id, option.id)}
                          className="w-full relative h-12 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 group/opt"
                        >
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className={cn(
                              "absolute inset-y-0 left-0 transition-all",
                              hasVoted ? "bg-blue-500/10" : "bg-slate-50 dark:bg-slate-800"
                            )}
                          />
                          <div className="absolute inset-0 px-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-sm font-bold transition-colors",
                                hasVoted ? "text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                              )}>
                                {option.text}
                              </span>
                              {hasVoted && <CheckCircle2 size={14} className="text-blue-500" />}
                            </div>
                            <span className="text-xs font-bold text-slate-400">{percentage}%</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {post.poll.options.reduce((acc, opt) => acc + opt.votes.length, 0)} total votes
                  </p>
                </div>
              )}

              {post.imageUrl && (
                <div className="px-4 pb-4">
                  <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700">
                    <img src={post.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                </div>
              )}

              {/* Post Actions & Reactions */}
              <div className="px-6 py-4 flex items-center justify-between border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
                <div className="flex items-center gap-1">
                  {REACTION_TYPES.map((reaction) => {
                    const count = post.reactions?.[reaction.id]?.length || 0;
                    const isReacted = post.reactions?.[reaction.id]?.includes(user?.id || '');
                    
                    return (
                      <button
                        key={reaction.id}
                        onClick={() => handleReaction(post.id, reaction.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-90",
                          isReacted 
                            ? "bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700" 
                            : "hover:bg-white/50 dark:hover:bg-slate-800/50"
                        )}
                      >
                        <reaction.icon 
                          size={16} 
                          className={cn(
                            "transition-all",
                            isReacted ? cn(reaction.color, reaction.fill) : "text-slate-400"
                          )} 
                        />
                        {count > 0 && (
                          <span className={cn(isReacted ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400")}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setSelectedPost(post); fetchComments(post.id); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-500 dark:hover:text-blue-400 transition-all"
                  >
                    <MessageCircle size={18} />
                    {post.commentsCount}
                  </button>
                  <button className="p-2 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Post Modal */}
      {createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                    <Plus size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">New Post</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleCreatePost} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                {/* Category Selection */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.filter(c => c !== 'All').map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewPost({...newPost, category: cat as Post['category']})}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                          newPost.category === cat 
                            ? "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-100 dark:shadow-none" 
                            : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      isPollMode ? "bg-blue-500 text-white" : "bg-white dark:bg-slate-800 text-slate-400"
                    )}>
                      <BarChart2 size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Create a Poll</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Ask the community</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsPollMode(!isPollMode)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      isPollMode ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      isPollMode ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>

                {isPollMode ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <input 
                      type="text" 
                      placeholder="What's your question?"
                      value={pollData.question}
                      onChange={(e) => setPollData({...pollData, question: e.target.value})}
                      className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 dark:text-white"
                    />
                    <div className="space-y-2">
                      {pollData.options.map((opt, idx) => (
                        <input 
                          key={idx}
                          type="text" 
                          placeholder={`Option ${idx + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...pollData.options];
                            newOptions[idx] = e.target.value;
                            setPollData({...pollData, options: newOptions});
                          }}
                          className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                        />
                      ))}
                      {pollData.options.length < 5 && (
                        <button 
                          type="button"
                          onClick={() => setPollData({...pollData, options: [...pollData.options, '']})}
                          className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 mt-2"
                        >
                          <Plus size={14} /> Add another option
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <textarea 
                    placeholder="Share your health journey, tips, or success stories..."
                    required
                    value={newPost.content}
                    onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                    className="w-full h-40 p-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-700 dark:text-slate-300 leading-relaxed"
                  />
                )}

                <div className="space-y-4">
                  <div className="relative group">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                      type="text" 
                      placeholder="Image URL (optional)"
                      value={newPost.imageUrl}
                      onChange={(e) => setNewPost({...newPost, imageUrl: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-600 shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-[0.98]">
                  Share Post
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}

      {/* Comments Modal */}
      {createPortal(
        <AnimatePresence>
          {selectedPost && (
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-md">
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-[32px] w-full max-w-lg h-[75vh] sm:h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
              >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                    <MessageCircle size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Comments</h2>
                </div>
                <button onClick={() => setSelectedPost(null)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-slate-900/50">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-50 dark:border-slate-700">
                      <img src={comment.authorPhoto || `https://ui-avatars.com/api/?name=${comment.authorName}&background=3b82f6&color=fff`} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{comment.authorName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(comment.createdAt).toLocaleDateString()}</p>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm">
                      <Smile className="text-slate-200 dark:text-slate-600" size={32} />
                    </div>
                    <div>
                      <h3 className="text-slate-900 dark:text-white font-bold">No comments yet</h3>
                      <p className="text-slate-400 text-sm">Be the first to start the conversation!</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                  />
                  <button type="submit" className="p-3 sm:p-3.5 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 shadow-lg shadow-blue-100 dark:shadow-none transition-all active:scale-90">
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}

      {/* User Profile Modal */}
      {createPortal(
        <AnimatePresence>
          {viewingUser && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="relative h-32 bg-gradient-to-br from-blue-500 to-blue-600">
                <button 
                  onClick={() => setViewingUser(null)}
                  className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="px-8 pb-8">
                <div className="relative -mt-12 mb-6">
                  <div className="w-24 h-24 rounded-[32px] bg-white dark:bg-slate-900 p-1.5 shadow-xl">
                    <div className="w-full h-full rounded-[26px] bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-50 dark:border-slate-700">
                      <img src={viewingUser.photoUrl || `https://ui-avatars.com/api/?name=${viewingUser.fullName}&background=3b82f6&color=fff`} alt="" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  {viewingUser.role === 'admin' && (
                    <div className="absolute bottom-0 left-20 bg-blue-500 text-white p-1.5 rounded-full border-4 border-white dark:border-slate-900">
                      <CheckCircle2 size={14} />
                    </div>
                  )}
                </div>

                <div className="space-y-1 mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{viewingUser.fullName}</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">@{viewingUser.username}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {viewingUser.role}
                    </span>
                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {viewingUser.points} Points
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-6 border-y border-slate-100 dark:border-slate-800">
                  <div className="text-center">
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {posts.filter(p => p.authorId === viewingUser.id).length}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Posts</p>
                  </div>
                  <div className="text-center border-l border-slate-100 dark:border-slate-800">
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {viewingUser.badgeStatus === 'approved' ? 'Active' : 'Member'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Status</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <Calendar size={18} className="text-slate-400" />
                    <span className="text-sm">Joined {new Date(viewingUser.createdAt).toLocaleDateString()}</span>
                  </div>
                  {viewingUser.address && (
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                      <User size={18} className="text-slate-400" />
                      <span className="text-sm">{viewingUser.address}</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setViewingUser(null)}
                  className="w-full mt-8 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </div>
  );
}

