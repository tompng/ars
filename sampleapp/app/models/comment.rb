class Comment < ApplicationRecord
  belongs_to :user
  belongs_to :post
  has_many :reactions, as: :target, dependent: :destroy

  sync_parent :post, inverse_of: :comments
  sync_parent :post, inverse_of: :comments_last5
  sync_parent :post, affects: :comments_count
  sync_field :post_id, :body, :created_at, :updated_at, :user
  include SyncReactionConcern
end
