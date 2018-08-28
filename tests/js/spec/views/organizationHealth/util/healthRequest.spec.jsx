import {mount} from 'enzyme';
import React from 'react';

import {doHealthRequest} from 'app/actionCreators/health';
import {HealthRequestWithParams} from 'app/views/organizationHealth/util/healthRequest';

const COUNT_OBJ = {
  count: 123,
  release: {
    _health_id: 'release:release-slug',
    value: {slug: 'release-slug'},
  },
};

jest.mock('app/actionCreators/health', () => {
  return {
    doHealthRequest: jest.fn(),
  };
});

describe('HealthRequest', function() {
  const project = TestStubs.Project();
  const organization = TestStubs.Organization();
  const mock = jest.fn(() => null);
  let wrapper;

  describe('with props changes', function() {
    beforeAll(function() {
      doHealthRequest.mockImplementation(() =>
        Promise.resolve({
          data: [[new Date(), [COUNT_OBJ]]],
        })
      );
      wrapper = mount(
        <HealthRequestWithParams
          api={{}}
          projects={[project.id]}
          environments={[]}
          period="24h"
          includePrevious={false}
          organization={organization}
          tag="release"
        >
          {mock}
        </HealthRequestWithParams>
      );
    });

    it('makes requests', async function() {
      expect(mock).toHaveBeenCalledWith(
        expect.objectContaining({
          loading: true,
          data: null,
          originalData: null,
        })
      );

      expect(mock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          loading: false,
          data: [
            {
              seriesName: expect.anything(),
              data: [
                expect.objectContaining({
                  name: expect.any(Number),
                  value: 123,
                }),
              ],
            },
          ],
          originalData: [[expect.anything(), expect.anything()]],
        })
      );

      expect(doHealthRequest).toHaveBeenCalled();
    });

    it('makes a new request if projects prop changes', async function() {
      doHealthRequest.mockClear();

      wrapper.setProps({projects: ['123']});
      expect(doHealthRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          projects: ['123'],
        })
      );
    });

    it('makes a new request if environments prop changes', async function() {
      doHealthRequest.mockClear();

      wrapper.setProps({environments: ['dev']});
      expect(doHealthRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          environments: ['dev'],
        })
      );
    });

    it('makes a new request if period prop changes', async function() {
      doHealthRequest.mockClear();

      wrapper.setProps({period: '7d'});
      expect(doHealthRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          period: '7d',
        })
      );
    });

    it('makes a new request if timeseries prop changes', async function() {
      doHealthRequest.mockClear();

      wrapper.setProps({timeseries: false});
      expect(doHealthRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          timeseries: false,
        })
      );
    });
  });

  it('defines a category name getter', async function() {
    doHealthRequest.mockImplementation(() =>
      Promise.resolve({
        data: [[new Date(), [COUNT_OBJ]]],
      })
    );
    wrapper = mount(
      <HealthRequestWithParams
        api={{}}
        projects={[project.id]}
        environments={[]}
        period="24h"
        organization={organization}
        tag="release"
        getCategory={release => release && release.slug}
      >
        {mock}
      </HealthRequestWithParams>
    );
    await tick();
    wrapper.update();
    expect(mock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        loading: false,
        data: [
          {
            seriesName: 'release-slug',
            data: [
              expect.objectContaining({
                name: expect.anything(),
                value: 123,
              }),
            ],
          },
        ],
        originalData: [[expect.anything(), expect.anything()]],
      })
    );
  });

  it('expands period in query if `includePrevious` and `timeseries`', async function() {
    // doHealthRequest.mockClear();
    doHealthRequest.mockImplementation(() =>
      Promise.resolve({
        data: [[new Date(), [{...COUNT_OBJ, count: 321}]], [new Date(), [COUNT_OBJ]]],
      })
    );
    wrapper = mount(
      <HealthRequestWithParams
        api={{}}
        projects={[project.id]}
        environments={[]}
        period="24h"
        organization={organization}
        tag="release"
        timeseries={true}
        includePrevious={true}
        getCategory={({slug} = {}) => slug}
      >
        {mock}
      </HealthRequestWithParams>
    );

    // actionCreator handles expanding the period when calling the API
    expect(doHealthRequest).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        period: '24h',
      })
    );

    await tick();
    wrapper.update();

    expect.objectContaining({
      loading: false,
      data: [
        {
          seriesName: expect.anything(),
          data: [
            expect.objectContaining({
              name: expect.any(Number),
              value: 123,
            }),
          ],
        },
      ],
      originalData: [[expect.anything(), expect.anything()]],
      previousPeriod: [
        {
          seriesName: expect.anything(),
          data: [
            expect.objectContaining({
              name: expect.any(Number),
              value: 321,
            }),
          ],
        },
      ],
    });
  });

  it('transforms data for non-timeseries response', async function() {
    doHealthRequest.mockImplementation(() =>
      Promise.resolve({
        data: [COUNT_OBJ],
      })
    );
    wrapper = mount(
      <HealthRequestWithParams
        api={{}}
        projects={[project.id]}
        environments={[]}
        period="24h"
        organization={organization}
        tag="release"
        timeseries={false}
        getCategory={({slug} = {}) => slug}
      >
        {mock}
      </HealthRequestWithParams>
    );
    await tick();
    wrapper.update();
    expect(mock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        loading: false,
        data: [['release-slug', 123]],
        originalData: [
          {
            count: 123,
            release: {value: {slug: 'release-slug'}, _health_id: 'release:release-slug'},
          },
        ],
      })
    );
  });
});
