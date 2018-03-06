class ARSync::Field
  attr_reader :name
  def initialize(name)
    @name = name
  end

  def skip_propagation?(_parent, _child)
    false
  end

  def action_convert(action)
    action
  end
end

class ARSync::DataField < ARSync::Field
  def type
    :data
  end

  def data(parent, _child, to_user:, **)
    ArSerializer.serialize parent, name, context: to_user, use: :sync
  end

  def path(_child)
    []
  end

  def action_convert(_action)
    :update
  end
end

class ARSync::HasOneField < ARSync::Field
  def type
    :one
  end

  def data(_parent, child, action:, **)
    child._sync_data new_record: action == :create
  end

  def path(_child)
    [name]
  end
end

class ARSync::HasManyField < ARSync::Field
  attr_reader :limit, :order, :propagate_when
  def type
    :many
  end

  def initialize(name, limit: nil, order: nil, propagate_when: nil)
    super name
    @limit = limit
    @order = order
    @propagate_when = propagate_when
  end

  def skip_propagation?(parent, child)
    return false unless limit
    if propagate_when
      !propagate_when.call(child)
    else
      parent.send(name).order(id: order).limit(limit).ids.include? child.id
    end
  end

  def data(_parent, child, action:, **)
    data = child._sync_data new_record: action == :create
    data[:order_params] = { limit: limit, order: order } if order
    data
  end

  def path(child)
    [name, child.id]
  end
end
