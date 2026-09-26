<?php

namespace App\Models\Dept;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Cases;

class DeptDental extends Model
{
    use HasFactory;

    protected $table = 'dept_dental';

    protected $guarded = ['id'];

    protected static function booted()
    {
        static::saving(function ($model) {
            if (!empty($model->primary_diagnosis) && empty($model->primary_condition)) {
                $model->primary_condition = $model->primary_diagnosis;
            } elseif (!empty($model->primary_condition) && empty($model->primary_diagnosis)) {
                $model->primary_diagnosis = $model->primary_condition;
            }

            if (!empty($model->diagnosis_other) && empty($model->condition_other)) {
                $model->condition_other = $model->diagnosis_other;
            } elseif (!empty($model->condition_other) && empty($model->diagnosis_other)) {
                $model->diagnosis_other = $model->condition_other;
            }
        });
    }

    public function case()
    {
        return $this->belongsTo(Cases::class, 'case_id');
    }
}
