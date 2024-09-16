enum GridFilterTypeEnum {
    equalityFilter = 'equalityFilter',
    rangeFilter = 'rangeFilter',
}

type GridFilterValue<T> = {
    type: GridFilterTypeEnum;
    fieldName: keyof T;
    filter: Extract<T, string | number>;
    filterTo?: Extract<T, string | number>;
};

type GridFilterSetValues<T, V> = {
    fieldName: keyof T;
    values: V[];
};

interface IFilter<T> {
    apply(data: T[]): T[];
}

class EqualityFilter<T> implements IFilter<T> {
    constructor(
        public fieldName: keyof T,
        public filter: string | number
    ) {}

    apply(data: T[]): T[] {
        return data.filter(item => item[this.fieldName] === this.filter);
    }
}

class RangeFilter<T> implements IFilter<T> {
    constructor(
        public fieldName: keyof T,
        public filter: number, 
        public filterTo: number
    ) {}

    apply(data: T[]): T[] {
        return data.filter(item => {
            const value = item[this.fieldName] as unknown as number;
            return value >= this.filter && value <= this.filterTo;
        });
    }
}

class ValuesFilter<T, V extends string | number> implements IFilter<T> {
    constructor(
        public fieldName: keyof T,
        public values: V[]
    ) {}

    apply(data: T[]): T[] {
        return data.filter(item => this.values.includes(item[this.fieldName] as V));
    }
}

interface IEntity {
    name: string;
}

class Movie implements IEntity {
    constructor(
        public name: string,
        public year: number,
        public rate: number,
        public awards: string[],
    ) {}
}

class Category implements IEntity {
    constructor(
        public name: string,
        public movies: Movie[]
    ) {}
}

abstract class EntityList<T extends IEntity> {
    protected list: T[];
    protected filters: IFilter<T>[] = [];

    public applySearchValue(searchString: string | number, fieldName: keyof T = 'name') {
        this.filters.push(new EqualityFilter<T>(fieldName, searchString));
        this.applyFilters();
    }

    public applyFiltersValue(filters: GridFilterValue<T>[] | GridFilterSetValues<T, string>[]): T[] {
        if (!filters.length) {
            this.filters = [];
            return this.list;
        }

        filters.forEach(filter => {
            if ('type' in filter && filter.type === GridFilterTypeEnum.equalityFilter) {
                this.filters.push(new EqualityFilter<T>(filter.fieldName, filter.filter));
            } else if ('type' in filter && filter.type === GridFilterTypeEnum.rangeFilter) {
                this.filters.push(new RangeFilter<T>(filter.fieldName as keyof T, filter.filter as number, filter.filterTo as number));
            } else {
                const setFilter = filter as GridFilterSetValues<T, string>;
                this.filters.push(new ValuesFilter<T, string>(setFilter.fieldName, setFilter.values));
            }
        });
        return this.applyFilters();
    }

    protected applyFilters(): T[] {
        return this.filters.reduce((filteredList, filter) => filter.apply(filteredList), this.list);
    }
}

class MovieList extends EntityList<Movie> {
    constructor(list: Movie[]) {
        super();
        this.list = list;
    }
}

class CategoryList extends EntityList<Category> {
    constructor(list: Category[]) {
        super();
        this.list = list;
    }
}
