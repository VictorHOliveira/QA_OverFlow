$(document).ready(function() {
    var pageArray = document.location.href.split('/');
    var currentPageSlug = pageArray[pageArray.length - 1];
    if (!currentPageSlug) {
        currentPageSlug = pageArray[pageArray.length - 2];
    }
    
    $.ajax({
        url: __blogURL + '/data/blog.json',
        type: 'GET',
        dataType: 'json',
        success: function(data) {
            if (data.posts !== undefined && data.posts !== null) {
                var currentPost = null;
                var currentTags = [];
                
                // Find current post and get its tags
                $.each(data.posts, function(i, post) {
                    if (post.slug === currentPageSlug || post.slug + '/' === currentPageSlug) {
                        currentPost = post;
                        currentTags = post.tags || [];
                        return false;
                    }
                });
                
                if (currentPost && currentTags.length > 0) {
                    var relatedPosts = [];
                    
                    // Find posts with matching tags
                    $.each(data.posts, function(i, post) {
                        if (post.slug === currentPageSlug || post.slug + '/' === currentPageSlug) {
                            return true; // Skip current post
                        }
                        
                        var postTags = post.tags || [];
                        var hasMatchingTag = false;
                        
                        $.each(currentTags, function(j, tag) {
                            if ($.inArray(tag, postTags) !== -1) {
                                hasMatchingTag = true;
                                return false;
                            }
                        });
                        
                        if (hasMatchingTag) {
                            relatedPosts.push(post);
                        }
                    });
                    
                    // Display related posts (max 5)
                    var $list = $('#related-posts-list');
                    $list.empty();
                    
                    if (relatedPosts.length > 0) {
                        $.each(relatedPosts.slice(0, 5), function(i, post) {
                            $list.append('<li style="margin-bottom: 10px;"><a href="' + __blogURL + '/post/' + post.slug + '">' + post.title + '</a></li>');
                        });
                    } else {
                        $list.append('<li>Nenhum post relacionado encontrado.</li>');
                    }
                }
            }
        }
    });
});
