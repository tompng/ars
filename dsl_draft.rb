exit

# preloadable
class Post < ActiveRecord::Base
  include ARSync
  preloadable :id, :title, :body, :created_at, :updated_at
  preloadable do
    column :id, :title, :body
  end
  preloadable includes: :user do
    column(:user_name) { user.name }
    column(:user_exist) { user.present? }
  end
  preloadable(:star_count).includes(:comments).preload { |posts|
    Star.where(comment_id: posts.flat_map(:comments).map(&:id)).group(:comment_id).count
  }.data { |preloaded|
    comments.map { |c| preloaded[c.id] }.sum
  }
  custom_preload(:star_count) do
    includes :stars
    preload { |posts| aggregate }
    data { |aggregated| aggregatd[id] }
  end
  preloadable_group includes: :user, preload: ->{ custom_preload } do
    preloadable(:uniq_user_comment_count) { |preloaded| preloaded[id].foo }
    preloadable(:uniq_user_comment_count) { |preloaded| preloaded[id].bar }
  end

  preloader(:foo) { |posts| custom_preload }
  preloader(:bar) { |posts| custom_preload }
  preloadable :foooo, includes: :aaa, preloader: :foo do |preloaded_foos|
    preloaded_foos[id].foooo
  end
  preloadable foobar, includes: :aaa, preloader: [:foo, :bar] do |foos, bars|
    foos[id] + bars[id]
  end
end
