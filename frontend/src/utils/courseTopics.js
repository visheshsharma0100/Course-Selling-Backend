export const getTopicTitle = (topic, fallback = 'Untitled topic') => {
  if (typeof topic === 'string') return topic
  return topic?.title || fallback
}

export const getCourseTopics = (course) => Array.isArray(course?.syllabus) ? course.syllabus : []
