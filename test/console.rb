require_relative 'model'
ARSync.configure do |key:, action:, path:, data:|
  msg = { key: key, action: action, path: path, data: data }.inspect
  puts "\e[1m#{msg}\e[m"
end

Star.joins(comment: :post).where(user: User.first, comments: {posts: {user_id: User.first.id}}).last._sync_notify :update
Comment.last._sync_notify :update
ARPreload::Serializer.serialize Post.last, comments: :star_count
query = [:name, posts: [:id, :user, :title, comments: [:id, :star_count, :user, my_stars: :id]]]
p ARSync.sync_api(User.first, User.first, *query)
binding.pry